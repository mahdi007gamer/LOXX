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
        localStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
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

      pc.ontrack = ({ streams: [stream] }) => {
        if (!stream) return;
        setRemoteStreams((prev) => {
          const map = new Map(prev);
          const existing = map.get(targetUserId) as MediaStream | undefined;
          if (!existing || existing.id !== stream.id) {
            map.set(targetUserId, stream);
            return map;
          }
          return prev;
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
