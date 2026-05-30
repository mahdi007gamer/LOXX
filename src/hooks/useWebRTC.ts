import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Track negotiation state to prevent "glare" (polite peer implementation)
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
  const ignoreOfferRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (localStream && localStream !== localStreamRef.current) {
      const oldStream = localStreamRef.current;
      localStreamRef.current = localStream;

      peersRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const currentTracks = localStream.getTracks();

        // 1. Remove tracks that are no longer in the new stream
        senders.forEach((sender) => {
          if (sender.track && !currentTracks.some(t => t.id === sender.track!.id)) {
            pc.removeTrack(sender);
          }
        });

        // 2. Add new tracks that aren't currently being sent (by matching ID)
        currentTracks.forEach((track) => {
          const sender = senders.find(s => s.track?.id === track.id);
          if (!sender) {
            pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !userId) return;

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
        ],
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
        setRemoteStreams((prev) => {
          const map = new Map<string, MediaStream>(prev);
          const existing = map.get(targetUserId) as MediaStream | undefined;
          const incomingStream = event.streams[0] as MediaStream | undefined;
          
          if (!existing) {
            const newStream = incomingStream || new MediaStream([event.track]);
            
            // Listen for future track removals on this stream to force re-render
            newStream.onremovetrack = () => {
              setRemoteStreams(current => new Map(current));
            };
            newStream.onaddtrack = () => {
              setRemoteStreams(current => new Map(current));
            };
            
            map.set(targetUserId, newStream);
            return map;
          } else {
            // If it's a completely new stream object ID, replace it
            if (incomingStream && existing.id !== incomingStream.id) {
               incomingStream.onremovetrack = () => {
                 setRemoteStreams(current => new Map(current));
               };
               incomingStream.onaddtrack = () => {
                 setRemoteStreams(current => new Map(current));
               };
               map.set(targetUserId, incomingStream);
            } else {
               // Track added to existing stream
               if (!existing.getTracks().find(t => t.id === event.track.id)) {
                 existing.addTrack(event.track);
               }
            }
            return new Map(map); // trigger re-render
          }
        });
      };

      pc.onnegotiationneeded = async () => {
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

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
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
        const isPolite = userId < fromUserId; // Stable role assignment

        if (signal.description) {
          const description = new RTCSessionDescription(signal.description);
          const offerCollision = description.type === "offer" &&
            (makingOfferRef.current.get(fromUserId) || pc?.signalingState !== "stable");

          ignoreOfferRef.current.set(fromUserId, !isPolite && offerCollision);
          if (ignoreOfferRef.current.get(fromUserId)) return;

          if (!pc) {
            pc = createPeer(fromUserId);
            peersRef.current.set(fromUserId, pc);
          }

          await pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            voiceSocket.emit("voice.signal", {
              targetUserId: fromUserId,
              signal: { description: pc.localDescription },
            });
          }
        } else if (signal.candidate) {
          try {
            if (!pc) return; // Should not happen with description-first signaling
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (!ignoreOfferRef.current.get(fromUserId)) throw err;
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
        pc.close();
        peersRef.current.delete(leftUserId);
      }
      makingOfferRef.current.delete(leftUserId);
      ignoreOfferRef.current.delete(leftUserId);
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

      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      makingOfferRef.current.clear();
      ignoreOfferRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
