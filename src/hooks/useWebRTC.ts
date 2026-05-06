import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const negotiationStateRef = useRef<Map<string, { makingOffer: boolean, ignoreOffer: boolean }>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, any[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // If localStream changed, add tracks to all existing peers
    if (localStream && localStream !== localStreamRef.current) {
      localStreamRef.current = localStream;
      peersRef.current.forEach(pc => {
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
            const isAlreadySending = senders.some(s => s.track === track);
            if (!isAlreadySending) {
               pc.addTrack(track, localStream);
            }
        });
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !userId) return;

    // Join the voice signaling channel
    voiceSocket.emit('voice.join', { roomId });

    const getNegotiationState = (uId: string) => {
      if (!negotiationStateRef.current.has(uId)) {
        negotiationStateRef.current.set(uId, { makingOffer: false, ignoreOffer: false });
      }
      return negotiationStateRef.current.get(uId)!;
    };

    const createPeer = (targetUserId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          voiceSocket.emit("voice.signal", {
            targetUserId,
            signal: { candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("WebRTC: received remote track", targetUserId);
        let stream = event.streams && event.streams[0];
        if (!stream) {
          stream = new MediaStream();
          stream.addTrack(event.track);
        }
        setRemoteStreams((prev) => {
          const map = new Map(prev);
          map.set(targetUserId, stream);
          return map;
        });
      };

      pc.onnegotiationneeded = async () => {
        try {
          const state = getNegotiationState(targetUserId);
          state.makingOffer = true;
          const offer = await pc.createOffer();
          if (pc.signalingState !== "stable") return;
          await pc.setLocalDescription(offer);
          voiceSocket.emit("voice.signal", {
            targetUserId,
            signal: pc.localDescription,
          });
        } catch (err) {
          console.error("Negotiation error:", err);
        } finally {
          const state = getNegotiationState(targetUserId);
          state.makingOffer = false;
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          pc.restartIce();
        }
      };

      // Add tracks AFTER setting handlers to ensure onnegotiationneeded triggers
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    };

    const handleUserJoined = (data: { userId: string }) => {
      if (data.userId === userId) return;
      console.log("WebRTC: user joined", data.userId);
      if (!peersRef.current.has(data.userId)) {
        const pc = createPeer(data.userId, true);
        peersRef.current.set(data.userId, pc);
      }
    };

    const handleUserLeft = (data: { userId: string }) => {
      console.log("WebRTC: user left", data.userId);
      if (peersRef.current.has(data.userId)) {
        peersRef.current.get(data.userId)?.close();
        peersRef.current.delete(data.userId);
      }
      negotiationStateRef.current.delete(data.userId);
      setRemoteStreams(prev => {
        const map = new Map(prev);
        map.delete(data.userId);
        return map;
      });
    };

    const handleSignal = async (data: { fromUserId: string, signal: any }) => {
      if (data.fromUserId === userId) return;
      
      const pc = peersRef.current.get(data.fromUserId);
      if (!pc) {
        // If we get a signal but have no PC, create one (polite side)
        const newPc = createPeer(data.fromUserId, false);
        peersRef.current.set(data.fromUserId, newPc);
        // Wait a tiny bit then handle the signal again now that PC exists
        await handleSignal(data);
        return;
      }

      const isSlowNode = userId! > data.fromUserId;
      const description = data.signal;
      const state = getNegotiationState(data.fromUserId);

      try {
        if (description.type) {
          const offerCollision =
            description.type === "offer" &&
            (state.makingOffer || pc.signalingState !== "stable");

          state.ignoreOffer = !isSlowNode && offerCollision;
          if (state.ignoreOffer) return;

          await pc.setRemoteDescription(new RTCSessionDescription(description));
          if (description.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            voiceSocket.emit("voice.signal", {
              targetUserId: data.fromUserId,
              signal: pc.localDescription,
            });
          }

          // Process buffered candidates
          const candidates = pendingCandidatesRef.current.get(data.fromUserId) || [];
          for (const cand of candidates) {
            await pc.addIceCandidate(cand);
          }
          pendingCandidatesRef.current.delete(data.fromUserId);
        } else if (description.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(description.candidate);
          } else {
            const buffered = pendingCandidatesRef.current.get(data.fromUserId) || [];
            buffered.push(description.candidate);
            pendingCandidatesRef.current.set(data.fromUserId, buffered);
          }
        }
      } catch (err) {
        console.error("Signal Handling Error:", err);
      }
    };

    voiceSocket.on('voice.user_joined', handleUserJoined);
    voiceSocket.on('voice.user_left', handleUserLeft);
    voiceSocket.on('voice.signal', handleSignal);

    return () => {
      voiceSocket.emit('voice.leave', { roomId });
      voiceSocket.off('voice.user_joined', handleUserJoined);
      voiceSocket.off('voice.user_left', handleUserLeft);
      voiceSocket.off('voice.signal', handleSignal);

      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
