const dgram = require('dgram');
const net = require('net');
const EventEmitter = require('events');

class LanBridge extends EventEmitter {
  constructor() {
    super();
    this.udpSockets = new Map(); // port -> dgram.Socket
    this.tcpServers = new Map(); // port -> net.Server
    this.tcpSockets = new Map(); // connectionId -> net.Socket (active streams)
    this.udpClients = new Map(); // connectionId -> dgram.Socket (for sending to host game)
    this.role = null; // 'host' or 'client'
    this.lobbyId = null;
    this.ports = [19132, 27015, 6112, 11155, 25565]; // Default games ports pool
    this.logListener = (level, ...args) => console.log(`[LAN_BRIDGE] [${level}]`, ...args);
  }

  setLogger(loggerFn) {
    this.logListener = loggerFn;
  }

  log(level, ...msg) {
    if (this.logListener) {
      this.logListener(level, ...msg);
    }
  }

  /**
   * Initialize LAN Relay Bridge
   * @param {string} role - 'host' | 'client'
   * @param {string} lobbyId - Active lobby reference
   * @param {number[]} [customPorts] - Override default ports pool
   */
  start(role, lobbyId, customPorts) {
    this.stopAndCleanup();
    this.role = role;
    this.lobbyId = lobbyId;
    if (customPorts && Array.isArray(customPorts) && customPorts.length > 0) {
      this.ports = customPorts;
    }

    this.log('INFO', `Initializing LAN Bridge as [${role}] for lobby [${lobbyId}] with ports: ${this.ports.join(', ')}`);

    // 1. SETUP UDP BROADCAST INBOUND INTERCEPTORS (Active on both Host and Clients for discovery)
    this.setupUdpDiscoveryRelay();

    // 2. SETUP CLIENT TCP/UDP PROXY SERVERS (Direct connections - Active only on Clients)
    if (this.role === 'client') {
      this.setupClientProxies();
    }
    
    this.emit('lan-status', { status: 'started', role, lobbyId, ports: this.ports });
  }

  setupUdpDiscoveryRelay() {
    this.ports.forEach((port) => {
      try {
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        
        socket.on('message', (msg, rinfo) => {
          // Prevent feedback loops: ignore packets sent from our own LAN bridge
          if (rinfo.address === '127.0.0.1' && rinfo.port === port) return;

          // If we are Host, we capture the local game server's broadcast announcements to send to clients
          if (this.role === 'host') {
            this.log('DEBUG', `Captured Host discovery broadcast on port ${port} from ${rinfo.address}:${rinfo.port}`);
            this.emit('packet-broadcast', {
              port,
              data: msg.toString('hex')
            });
          }
        });

        socket.on('error', (err) => {
          this.log('WARN', `UDP socket error on port ${port}:`, err.message);
          this.emit('lan-error', { type: 'UDP_BIND_FAILED', port, message: err.message });
        });

        // Bind cleanly to listen for local game UDP broadcasts
        socket.bind(port, '0.0.0.0', () => {
          try {
            socket.setBroadcast(true);
            socket.setMulticastLoopback(true);
            this.log('INFO', `UDP broadcast interceptor listening on port ${port}`);
          } catch (e) {
            this.log('WARN', `Could not set broadcast permissions on port ${port}:`, e.message);
          }
        });

        this.udpSockets.set(port, socket);
      } catch (err) {
        this.log('ERROR', `Failed to create UDP socket on port ${port}:`, err.message);
      }
    });
  }

  injectUdpPacket(port, hexData) {
    const socket = this.udpSockets.get(port);
    if (!socket) {
      this.log('WARN', `No active UDP socket for port ${port} to inject broadcast.`);
      return;
    }

    try {
      const buffer = Buffer.from(hexData, 'hex');
      this.log('DEBUG', `Injecting relayed UDP broadcast on port ${port} to loopback & general subnet...`);
      
      // Send to localhost (so game running locally captures it)
      socket.send(buffer, 0, buffer.length, port, '127.0.0.1', (err) => {
        if (err) this.log('WARN', `Failed to send UDP discovery to localhost on port ${port}:`, err);
      });

      // Send to broad broadcast address for subnets
      socket.send(buffer, 0, buffer.length, port, '255.255.255.255', (err) => {
        if (err) this.log('WARN', `Failed to send UDP discovery to subnet broadcast on port ${port}:`, err);
      });
    } catch (e) {
      this.log('ERROR', `Error injecting UDP packet on port ${port}:`, e.message);
    }
  }

  setupClientProxies() {
    this.ports.forEach((port) => {
      // 1. SETUP TCP PROXY SERVERS (E.G. Minecraft TCP 25565)
      try {
        const tcpServer = net.createServer((clientSocket) => {
          const connectionId = `tcp_${port}_${Math.random().toString(36).substring(2, 9)}`;
          this.log('INFO', `New TCP match connection started locally on port ${port}. Assigned ID: ${connectionId}`);

          this.tcpSockets.set(connectionId, clientSocket);

          // Tell the host to establish a remote session channel to the actual game
          this.emit('tcp-connect', { connectionId, port });

          clientSocket.on('data', (data) => {
            this.log('DEBUG', `Client proxy received ${data.length} bytes for connection [${connectionId}]`);
            this.emit('tcp-data', {
              connectionId,
              data: data.toString('hex')
            });
          });

          clientSocket.on('close', () => {
            this.log('INFO', `Client local TCP socket closed for connection [${connectionId}]`);
            this.tcpSockets.delete(connectionId);
            this.emit('tcp-close', { connectionId });
          });

          clientSocket.on('error', (err) => {
            this.log('WARN', `Client TCP socket error on connection [${connectionId}]:`, err.message);
          });
        });

        tcpServer.on('error', (err) => {
          this.log('ERROR', `Client TCP proxy server failed to start on port ${port}:`, err.message);
          this.emit('lan-error', { type: 'TCP_PROXY_BIND_FAILED', port, message: err.message });
        });

        tcpServer.listen(port, '127.0.0.1', () => {
          this.log('INFO', `Client Local TCP Proxy Server active on 127.0.0.1:${port}`);
        });

        this.tcpServers.set(port, tcpServer);
      } catch (err) {
        this.log('ERROR', `Failed setting up TCP proxy on port ${port}:`, err.message);
      }

      // 2. SETUP UDP UNICAST TUNNEL
      // For pure UDP multiplayer games (like WC3, CS 1.6), we run a local UDP listener.
      // Packets sent by game clients to this local socket will be forwarded to the host's actual server.
      try {
        const udpProxyPort = port + 10000; // Client game sends to localhost:port, we route
        const udpProxy = dgram.createSocket('udp4');

        udpProxy.on('message', (msg, rinfo) => {
          const connectionId = `udp_${port}_${rinfo.address}_${rinfo.port}`;
          this.log('DEBUG', `Forwarding clients UDP unicast frame for [${connectionId}]: ${msg.length} bytes`);
          
          this.emit('udp-data', {
            connectionId,
            port,
            data: msg.toString('hex'),
            clientAddress: rinfo.address,
            clientPort: rinfo.port
          });
        });

        udpProxy.on('error', (err) => {
          this.log('WARN', `Udp unicast proxy error on port ${udpProxyPort}:`, err.message);
        });

        // We bind to the game port on loopback so the client game connects to us directly
        udpProxy.bind(port, '127.0.0.1', () => {
          this.log('INFO', `Client Local UDP Proxy Tunnel active on 127.0.0.1:${port}`);
        });

        this.udpSockets.set(`proxy_${port}`, udpProxy);
      } catch (err) {
        this.log('ERROR', `Failed setting up UDP unicast proxy on port ${port}:`, err.message);
      }
    });
  }

  /* Host-side handling: Host opens direct backend connection to their actual running local game */
  handleHostTcpConnect(connectionId, port) {
    if (this.role !== 'host') return;
    this.log('INFO', `Lobby Client requested TCP tunnel. Host connecting to real game server on 127.0.0.1:${port}...`);

    const gameSocket = new net.Socket();
    
    gameSocket.connect(port, '127.0.0.1', () => {
      this.log('INFO', `Host successfully linked tunnel connection [${connectionId}] to active game server.`);
    });

    gameSocket.on('data', (data) => {
      this.log('DEBUG', `Host game server responded with ${data.length} bytes for [${connectionId}]`);
      this.emit('tcp-data', {
        connectionId,
        data: data.toString('hex')
      });
    });

    gameSocket.on('close', () => {
      this.log('INFO', `Host link socket terminated by local game for connection [${connectionId}]`);
      this.tcpSockets.delete(connectionId);
      this.emit('tcp-close', { connectionId });
    });

    gameSocket.on('error', (err) => {
      this.log('WARN', `Host game socket connection error on [${connectionId}]:`, err.message);
      this.emit('lan-error', { type: 'HOST_LINK_FAILED', port, message: err.message, connectionId });
    });

    this.tcpSockets.set(connectionId, gameSocket);
  }

  handleHostTcpData(connectionId, hexData) {
    const socket = this.tcpSockets.get(connectionId);
    if (socket) {
      try {
        socket.write(Buffer.from(hexData, 'hex'));
      } catch (err) {
        this.log('ERROR', `Failed to write local TCP stream chunk on Host:`, err.message);
      }
    } else {
      this.log('WARN', `Host cannot write TCP data: connection [${connectionId}] does not exist.`);
    }
  }

  handleHostTcpClose(connectionId) {
    const socket = this.tcpSockets.get(connectionId);
    if (socket) {
      try {
        socket.destroy();
      } catch (e) {}
      this.tcpSockets.delete(connectionId);
      this.log('INFO', `Deregistered dynamic Host connection mapping for [${connectionId}]`);
    }
  }

  /* Client-side handling: Client proxy receives response stream packets from Host */
  handleClientTcpData(connectionId, hexData) {
    const socket = this.tcpSockets.get(connectionId);
    if (socket) {
      try {
        socket.write(Buffer.from(hexData, 'hex'));
      } catch (err) {
        this.log('ERROR', `Failed to write TCP response to Client game:`, err.message);
      }
    }
  }

  handleClientTcpClose(connectionId) {
    const socket = this.tcpSockets.get(connectionId);
    if (socket) {
      try {
        socket.end();
      } catch (e) {}
      this.tcpSockets.delete(connectionId);
    }
  }

  /* UDP Unicast Data Bridging (For pure UDP multiplayer sessions) */
  handleUdpData(connectionId, port, hexData, isFromHost, clientAddress, clientPort) {
    const packet = Buffer.from(hexData, 'hex');

    if (this.role === 'host' && !isFromHost) {
      // 1. Host received packet from a Client. Relay it to Host's actual local game.
      let clientUdp = this.udpClients.get(connectionId);
      if (!clientUdp) {
        clientUdp = dgram.createSocket('udp4');
        clientUdp.on('message', (msg) => {
          this.log('DEBUG', `Host UDP game reply captured: ${msg.length} bytes. Relaying to Client.`);
          this.emit('udp-data', {
            connectionId,
            port,
            data: msg.toString('hex'),
            isResponse: true
          });
        });
        this.udpClients.set(connectionId, clientUdp);
      }

      clientUdp.send(packet, 0, packet.length, port, '127.0.0.1', (err) => {
        if (err) this.log('WARN', `Host UDP dispatch failure:`, err.message);
      });
    } else if (this.role === 'client' && isFromHost) {
      // 2. Client received response from Host. Write it to Client's local game socket.
      const udpProxy = this.udpSockets.get(`proxy_${port}`);
      if (udpProxy && clientAddress && clientPort) {
        udpProxy.send(packet, 0, packet.length, clientPort, clientAddress, (err) => {
          if (err) this.log('WARN', `Client UDP proxy return delivery failure:`, err.message);
        });
      }
    }
  }

  stopAndCleanup() {
    this.log('INFO', 'Halting all active LAN Proxy Relay nodes/handles...');

    // Close UDP sockets
    this.udpSockets.forEach((socket) => {
      try {
        socket.close();
      } catch (e) {}
    });
    this.udpSockets.clear();

    // Close TCP servers
    this.tcpServers.forEach((server) => {
      try {
        server.close();
      } catch (e) {}
    });
    this.tcpServers.clear();

    // Terminate TCP sockets
    this.tcpSockets.forEach((socket) => {
      try {
        socket.destroy();
      } catch (e) {}
    });
    this.tcpSockets.clear();

    // Terminate UDP client tunnels
    this.udpClients.forEach((socket) => {
      try {
        socket.close();
      } catch (e) {}
    });
    this.udpClients.clear();

    this.role = null;
    this.lobbyId = null;
    this.emit('lan-status', { status: 'stopped' });
  }
}

module.exports = new LanBridge();
