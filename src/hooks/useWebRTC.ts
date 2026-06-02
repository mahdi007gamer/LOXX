import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Track negotiation state to prevent "glare" (polite peer implementation)
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
  const ignoreOfferRef = useRef<Map<string, boolean>>(new Map());
  const candidatesQueueRef = useRef<Map<string, any[]>>(new Map());

  // Robust reconnection trackers per peer
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const reconnectTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (localStream !== localStreamRef.current) {
      localStreamRef.current = localStream;

      peersRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const currentTracks = localStream ? localStream.getTracks() : [];

        // 1. Remove tracks that are no longer in the new stream
        senders.forEach((sender) => {
          if (sender.track && !currentTracks.some(t => t.id === sender.track!.id)) {
            try {
              pc.removeTrack(sender);
            } catch (err) {
              console.error("WebRTC: Error removing track from peer connection", err);
            }
          }
        });

        // 2. Add new tracks that aren't currently being sent (by matching ID)
        currentTracks.forEach((track) => {
          const sender = senders.find(s => s.track?.id === track.id);
          if (!sender) {
            try {
              pc.addTrack(track, localStream!);
            } catch (err) {
              console.error("WebRTC: Error adding track to peer connection", err);
            }
          }
        });
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const handleReconnection = (targetUserId: string) => {
      if (reconnectTimeoutRef.current.has(targetUserId)) {
        clearTimeout(reconnectTimeoutRef.current.get(targetUserId));
      }

      const retries = retryCountRef.current.get(targetUserId) || 0;
      if (retries >= 8) {
        console.warn(`WebRTC: Max reconnection retries (8) reached for user ${targetUserId}`);
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Exponential backoff capped at 10 seconds
      retryCountRef.current.set(targetUserId, retries + 1);

      console.log(`WebRTC: Scheduling reconnection for ${targetUserId} in ${delay}ms (attempt ${retries + 1}/8)`);

      const timeout = setTimeout(() => {
        console.log(`WebRTC: Executing connection rebuild for user ${targetUserId}`);
        
        // Cleanly close and throw away the failed peer connection
        const oldPc = peersRef.current.get(targetUserId);
        if (oldPc) {
          try {
            oldPc.close();
          } catch (e) {}
          peersRef.current.delete(targetUserId);
        }

        // Reset signaling and negotiation state trackers for this peer
        makingOfferRef.current.set(targetUserId, false);
        ignoreOfferRef.current.set(targetUserId, false);
        candidatesQueueRef.current.set(targetUserId, []);

        // Create a clean new peer connection
        const newPc = createPeer(targetUserId);
        peersRef.current.set(targetUserId, newPc);
      }, delay);

      reconnectTimeoutRef.current.set(targetUserId, timeout);
    };

    voiceSocket.emit('voice.join', { roomId }, (response?: { users: string[] }) => {
      if (response && response.users) {
        response.users.forEach((existingUserId: string) => {
          if (!peersRef.current.has(existingUserId)) {
            const pc = createPeer(existingUserId);
            peersRef.current.set(existingUserId, pc);
          }
        });
      }
    });

    const handleExistingUsers = ({ users }: { users: string[] }) => {
      users.forEach((existingUserId: string) => {
        if (!peersRef.current.has(existingUserId)) {
          const pc = createPeer(existingUserId);
          peersRef.current.set(existingUserId, pc);
        }
      });
    };

    const createPeer = (targetUserId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:openrelay.metered.ca:80" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelay",
            credential: "openrelay"
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelay",
            credential: "openrelay"
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelay",
            credential: "openrelay"
          },
          {
            urls: "turns:openrelay.metered.ca:443",
            username: "openrelay",
            credential: "openrelay"
          },
          {
            urls: "turns:openrelay.metered.ca:443?transport=tcp",
            username: "openrelay",
            credential: "openrelay"
          }
        ],
        iceTransportPolicy: "all"
      });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          voiceSocket.emit("voice.signal", {
            targetUserId: targetUserId,
            signal: { candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`WebRTC: Received track ${event.track.kind} (${event.track.id}) from user ${targetUserId}`);
        setRemoteStreams((prev) => {
          const map = new Map<string, MediaStream>(prev);
          const existingStream = map.get(targetUserId);
          
          // Retrieve tracks from the existing stream if it exists
          const tracks = existingStream ? existingStream.getTracks() : [];
          
          // Only add if not already present
          if (!tracks.some((t) => t.id === event.track.id)) {
            tracks.push(event.track);
            console.log(`WebRTC: Track ${event.track.id} added to candidates for ${targetUserId}`);
          }
          
          // Always build a BRAND NEW MediaStream reference with all current tracks
          // This forces downstream hooks and elements (e.g. RemoteAudioPlayer and audio ref) to perceive a true reference change!
          const newStream = new MediaStream(tracks);
          map.set(targetUserId, newStream);
          console.log(`WebRTC: Recreated stream for ${targetUserId} with ${tracks.length} tracks.`);

          // Auto-clean on ended
          event.track.onended = () => {
            console.log(`WebRTC: Track ${event.track.id} ended for ${targetUserId}`);
            setRemoteStreams((current) => {
              const nextMap = new Map<string, MediaStream>(current);
              const s = nextMap.get(targetUserId);
              if (s) {
                const remainingTracks = s.getTracks().filter(t => t.id !== event.track.id);
                if (remainingTracks.length === 0) {
                  nextMap.delete(targetUserId);
                } else {
                  nextMap.set(targetUserId, new MediaStream(remainingTracks));
                }
                return nextMap;
              }
              return current;
            });
          };

          return map;
        });
      };

      pc.onnegotiationneeded = async () => {
        if (pc.signalingState !== "stable") {
          console.log(`WebRTC: skipping negotiation needed on ${targetUserId} as signalingState is ${pc.signalingState}`);
          return;
        }
        try {
          makingOfferRef.current.set(targetUserId, true);
          await pc.setLocalDescription();
          voiceSocket.emit("voice.signal", {
            targetUserId: targetUserId,
            signal: { description: pc.localDescription },
          });
        } catch (err) {
          console.error(`WebRTC: Negotiation error with ${targetUserId}:`, err);
        } finally {
          makingOfferRef.current.set(targetUserId, false);
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`WebRTC: Connection state for ${targetUserId} is ${state}`);
        if (state === "connected") {
          retryCountRef.current.set(targetUserId, 0); // Reset retries on successful connection
          if (reconnectTimeoutRef.current.has(targetUserId)) {
            clearTimeout(reconnectTimeoutRef.current.get(targetUserId)!);
            reconnectTimeoutRef.current.delete(targetUserId);
          }
        } else if (state === "failed" || state === "disconnected") {
          console.log(`WebRTC: Connection state ${state} for ${targetUserId}. Triggering reconnection...`);
          handleReconnection(targetUserId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`WebRTC: ICE connection state for ${targetUserId} is ${state}`);
        if (state === "failed" || state === "disconnected") {
          console.log(`WebRTC: ICE connection state ${state} for ${targetUserId}. Triggering reconnection...`);
          handleReconnection(targetUserId);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    };

    const handleSignal = async ({ fromUserId, signal }: { fromUserId: string, signal: any }) => {
      try {
        let pc = peersRef.current.get(fromUserId);
        const isPolite = userId ? (userId < fromUserId) : false; // Stable role assignment

        if (signal.description) {
          const description = new RTCSessionDescription(signal.description);
          
          // Re-create the peer connection cleanly if we get a new offer but our end is in a closed/failed state
          if (
            description.type === "offer" && 
            pc && 
            (pc.connectionState === "failed" || 
             pc.connectionState === "disconnected" || 
             pc.connectionState === "closed" ||
             pc.iceConnectionState === "failed" || 
             pc.iceConnectionState === "disconnected")
          ) {
            console.log(`WebRTC: Received new offer from ${fromUserId} but existing connection is stale/failed. Re-creating peer...`);
            try {
              pc.close();
            } catch (e) {}
            pc = createPeer(fromUserId);
            peersRef.current.set(fromUserId, pc);
          }

          const offerCollision = description.type === "offer" &&
            (makingOfferRef.current.get(fromUserId) || (pc && pc.signalingState !== "stable"));

          ignoreOfferRef.current.set(fromUserId, !isPolite && offerCollision);
          if (ignoreOfferRef.current.get(fromUserId)) {
            console.log(`WebRTC: Glare detected. Impolite peer ignoring offer from ${fromUserId}`);
            return;
          }

          if (!pc || pc.connectionState === "closed") {
            pc = createPeer(fromUserId);
            peersRef.current.set(fromUserId, pc);
          }

          if (offerCollision && isPolite) {
            console.log(`WebRTC: Glare detected. Polite peer rolling back for ${fromUserId}`);
            await pc.setLocalDescription({ type: "rollback" });
          }

          await pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            voiceSocket.emit("voice.signal", {
              targetUserId: fromUserId,
              signal: { description: pc.localDescription },
            });
          }

          // Drain cached ICE candidates for this peer
          const queue = candidatesQueueRef.current.get(fromUserId);
          if (queue && queue.length > 0) {
            console.log(`WebRTC: Draining ${queue.length} cached candidates for ${fromUserId}`);
            for (const candidate of queue) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.warn("WebRTC: Error adding queued candidate", err);
              }
            }
            candidatesQueueRef.current.set(fromUserId, []);
          }

        } else if (signal.candidate) {
          if (!pc || pc.connectionState === "closed" || !pc.remoteDescription) {
            // Queue the candidate until pc is created and remoteDescription is set
            let queue = candidatesQueueRef.current.get(fromUserId);
            if (!queue) {
              queue = [];
              candidatesQueueRef.current.set(fromUserId, queue);
            }
            queue.push(signal.candidate);
            console.log(`WebRTC: Queued early ICE candidate for ${fromUserId}`);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (err) {
              if (!ignoreOfferRef.current.get(fromUserId)) {
                console.error(`WebRTC: Error adding ICE candidate for ${fromUserId}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error("WebRTC: Signal error", err);
      }
    };

    const handleUserJoined = ({ userId: joinedUserId }: { userId: string }) => {
      if (joinedUserId === userId) return;
      if (!peersRef.current.has(joinedUserId)) {
        const pc = createPeer(joinedUserId);
        peersRef.current.set(joinedUserId, pc);
      }
    };

    const handleUserLeft = ({ userId: leftUserId }: { userId: string }) => {
      const pc = peersRef.current.get(leftUserId);
      if (pc) {
        try {
          pc.close();
        } catch (e) {}
        peersRef.current.delete(leftUserId);
      }
      makingOfferRef.current.delete(leftUserId);
      ignoreOfferRef.current.delete(leftUserId);
      candidatesQueueRef.current.delete(leftUserId);
      setRemoteStreams((prev) => {
        const map = new Map(prev);
        if (map.has(leftUserId)) {
          map.delete(leftUserId);
          return map;
        }
        return prev;
      });
    };

    voiceSocket.on('voice.user_joined', handleUserJoined);
    voiceSocket.on('voice.existing_users', handleExistingUsers);
    voiceSocket.on('voice.user_left', handleUserLeft);
    voiceSocket.on('voice.signal', handleSignal);

    return () => {
      voiceSocket.emit('voice.leave', { roomId });
      voiceSocket.off('voice.user_joined', handleUserJoined);
      voiceSocket.off('voice.existing_users', handleExistingUsers);
      voiceSocket.off('voice.user_left', handleUserLeft);
      voiceSocket.off('voice.signal', handleSignal);

      // Clear all scheduled reconnect timers
      reconnectTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      reconnectTimeoutRef.current.clear();
      retryCountRef.current.clear();

      peersRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      peersRef.current.clear();
      makingOfferRef.current.clear();
      ignoreOfferRef.current.clear();
      candidatesQueueRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
