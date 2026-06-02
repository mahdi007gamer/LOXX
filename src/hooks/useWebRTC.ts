import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Track standard perfect negotiation states (polite peer pattern to prevent glare)
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
  const ignoreOfferRef = useRef<Map<string, boolean>>(new Map());
  const isSettingRemoteRef = useRef<Map<string, boolean>>(new Map());
  const candidatesQueueRef = useRef<Map<string, any[]>>(new Map());

  // Automatically sync local tracks when localStream changes (e.g. microphone mute/unmute or device swaps)
  useEffect(() => {
    if (localStream !== localStreamRef.current) {
      console.log("WebRTC Mesh: Syncing local stream tracks to peers", localStream?.id);
      localStreamRef.current = localStream;

      peersRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const currentTracks = localStream ? localStream.getTracks() : [];

        // 1. Remove track senders that are no longer active
        senders.forEach((sender) => {
          if (sender.track && !currentTracks.some((t) => t.id === sender.track!.id)) {
            try {
              pc.removeTrack(sender);
            } catch (err) {
              console.error("WebRTC Mesh: Error removing slot track:", err);
            }
          }
        });

        // 2. Add or replace tracks inside the active peers
        currentTracks.forEach((track) => {
          const sender = senders.find((s) => s.track?.id === track.id);
          if (!sender) {
            try {
              pc.addTrack(track, localStream!);
            } catch (err) {
              console.error("WebRTC Mesh: Error adding track source:", err);
            }
          } else if (sender.track !== track) {
            try {
              sender.replaceTrack(track);
            } catch (err) {
              console.error("WebRTC Mesh: Error swap replacing track live:", err);
            }
          }
        });
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const createPeer = (targetUserId: string) => {
      console.log(`WebRTC Mesh: Initiating RTC connection to client peer: ${targetUserId}`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.services.mozilla.com" }
        ],
        sdpSemantics: "unified-plan"
      } as any);

      makingOfferRef.current.set(targetUserId, false);
      ignoreOfferRef.current.set(targetUserId, false);
      isSettingRemoteRef.current.set(targetUserId, false);
      candidatesQueueRef.current.set(targetUserId, []);

      // Wire up current localStream tracks safely
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
          console.log(`WebRTC Mesh: Bound local track ${track.kind} (${track.id}) to peer ${targetUserId}`);
        });
      }

      // Stream candidates instantly over Socket connection
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          voiceSocket.emit("voice.signal", {
            targetUserId: targetUserId,
            signal: { candidate },
          });
        }
      };

      // Direct native browser track injection
      pc.ontrack = (event) => {
        console.log(`WebRTC Mesh: Successfully received live digital audio track from user ${targetUserId}`);
        const stream = event.streams[0] || new MediaStream([event.track]);
        
        setRemoteStreams((prev) => {
          const map = new Map(prev);
          map.set(targetUserId, stream);
          return map;
        });

        event.track.onended = () => {
          console.log(`WebRTC Mesh: Audio ended for user ${targetUserId}`);
          setRemoteStreams((prev) => {
            const map = new Map(prev);
            map.delete(targetUserId);
            return map;
          });
        };
      };

      // Perform SDP Perfect Negotiation
      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current.set(targetUserId, true);
          await pc.setLocalDescription();
          voiceSocket.emit("voice.signal", {
            targetUserId: targetUserId,
            signal: { description: pc.localDescription },
          });
        } catch (err) {
          console.error(`WebRTC Mesh: SDP handshaking setup error with ${targetUserId}:`, err);
        } finally {
          makingOfferRef.current.set(targetUserId, false);
        }
      };

      // Track link connection dropouts and trigger reactive reconnects
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`WebRTC Mesh: Connection with user ${targetUserId} entered state: ${state}`);
        if (state === "failed" || state === "disconnected") {
          console.warn(`WebRTC Mesh: Peer link failed. Re-building connection tunnel to user ${targetUserId}`);
          reconnectPeer(targetUserId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`WebRTC Mesh: ICE setup with user ${targetUserId} entered state: ${state}`);
        if (state === "failed" || state === "disconnected") {
          console.warn(`WebRTC Mesh: ICE peer failed. Re-building candidate tunnels to user ${targetUserId}`);
          reconnectPeer(targetUserId);
        }
      };

      return pc;
    };

    const reconnectPeer = (targetUserId: string) => {
      const oldPc = peersRef.current.get(targetUserId);
      if (oldPc) {
        try { oldPc.close(); } catch (e) {}
        peersRef.current.delete(targetUserId);
      }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(targetUserId);
        return next;
      });

      // Quick backup delayed setup to give network time to stabilize
      setTimeout(() => {
        if (!peersRef.current.has(targetUserId) && roomId) {
          const pc = createPeer(targetUserId);
          peersRef.current.set(targetUserId, pc);
        }
      }, 1500);
    };

    // Process incoming signaling packets
    const handleSignal = async ({ fromUserId, signal }: { fromUserId: string, signal: any }) => {
      try {
        let pc = peersRef.current.get(fromUserId);
        const isPolite = userId ? (userId < fromUserId) : false; // Deterministic collision resolver

        if (signal.description) {
          const description = new RTCSessionDescription(signal.description);
          const offerCollision = description.type === "offer" &&
            (makingOfferRef.current.get(fromUserId) || (pc && pc.signalingState !== "stable"));

          const shouldIgnore = !isPolite && offerCollision;
          ignoreOfferRef.current.set(fromUserId, shouldIgnore);

          if (shouldIgnore) {
            console.warn(`WebRTC Perfect Negotiation: Glare. Impolite peer ignored offer from ${fromUserId}`);
            return;
          }

          if (!pc || pc.connectionState === "closed") {
            pc = createPeer(fromUserId);
            peersRef.current.set(fromUserId, pc);
          }

          if (offerCollision && isPolite) {
            console.log(`WebRTC Perfect Negotiation: Glare. Polite peer is rolling back for ${fromUserId}`);
            await pc.setLocalDescription({ type: "rollback" });
          }

          isSettingRemoteRef.current.set(fromUserId, true);
          await pc.setRemoteDescription(description);
          isSettingRemoteRef.current.set(fromUserId, false);

          if (description.type === "offer") {
            await pc.setLocalDescription();
            voiceSocket.emit("voice.signal", {
              targetUserId: fromUserId,
              signal: { description: pc.localDescription },
            });
          }

          // Drain cached candidates safely
          const queue = candidatesQueueRef.current.get(fromUserId) || [];
          for (const candidate of queue) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("WebRTC Mesh: Error adding queued early candidate:", err);
            }
          }
          candidatesQueueRef.current.set(fromUserId, []);

        } else if (signal.candidate) {
          if (!pc || isSettingRemoteRef.current.get(fromUserId) || !pc.remoteDescription) {
            const queue = candidatesQueueRef.current.get(fromUserId) || [];
            queue.push(signal.candidate);
            candidatesQueueRef.current.set(fromUserId, queue);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (err) {
              if (!ignoreOfferRef.current.get(fromUserId)) {
                console.error("WebRTC Mesh: Error adding candidate direct:", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("WebRTC Mesh: General signaling parsing exception:", err);
      }
    };

    const handleUserJoined = ({ userId: joinedUserId }: { userId: string }) => {
      if (joinedUserId === userId) return;
      if (!peersRef.current.has(joinedUserId)) {
        const pc = createPeer(joinedUserId);
        peersRef.current.set(joinedUserId, pc);
      }
    };

    const handleExistingUsers = ({ users }: { users: string[] }) => {
      users.forEach((existingUserId) => {
        if (existingUserId !== userId && !peersRef.current.has(existingUserId)) {
          const pc = createPeer(existingUserId);
          peersRef.current.set(existingUserId, pc);
        }
      });
    };

    const handleUserLeft = ({ userId: leftUserId }: { userId: string }) => {
      console.log(`WebRTC Mesh: Removing disconnected stream and clean memory for user ${leftUserId}`);
      const pc = peersRef.current.get(leftUserId);
      if (pc) {
        try { pc.close(); } catch (e) {}
        peersRef.current.delete(leftUserId);
      }
      makingOfferRef.current.delete(leftUserId);
      ignoreOfferRef.current.delete(leftUserId);
      isSettingRemoteRef.current.delete(leftUserId);
      candidatesQueueRef.current.delete(leftUserId);

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(leftUserId);
        return next;
      });
    };

    voiceSocket.on('voice.user_joined', handleUserJoined);
    voiceSocket.on('voice.existing_users', handleExistingUsers);
    voiceSocket.on('voice.user_left', handleUserLeft);
    voiceSocket.on('voice.signal', handleSignal);

    // Dynamic join and active sync to retrieve existing users in room
    voiceSocket.emit('voice.join', { roomId }, (resp?: { users: string[] }) => {
      if (resp && resp.users) {
        handleExistingUsers(resp);
      }
    });

    return () => {
      voiceSocket.emit('voice.leave', { roomId });
      voiceSocket.off('voice.user_joined', handleUserJoined);
      voiceSocket.off('voice.existing_users', handleExistingUsers);
      voiceSocket.off('voice.user_left', handleUserLeft);
      voiceSocket.off('voice.signal', handleSignal);

      peersRef.current.forEach((pc) => {
        try { pc.close(); } catch (e) {}
      });
      peersRef.current.clear();
      makingOfferRef.current.clear();
      ignoreOfferRef.current.clear();
      isSettingRemoteRef.current.clear();
      candidatesQueueRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
