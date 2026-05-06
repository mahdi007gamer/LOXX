import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
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

    const createPeer = (targetUserId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = event => {
        if (event.candidate) {
          voiceSocket.emit('voice.signal', {
            targetUserId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      pc.ontrack = event => {
        let stream = event.streams && event.streams[0];
        if (!stream) {
          stream = new MediaStream();
          stream.addTrack(event.track);
        }
        setRemoteStreams(prev => {
          const map = new Map(prev);
          map.set(targetUserId, stream);
          return map;
        });
      };

      pc.onnegotiationneeded = async () => {
         try {
            if (pc.signalingState !== 'stable') return;
            const offer = await pc.createOffer();
            if (pc.signalingState !== 'stable') return;
            await pc.setLocalDescription(offer);
            voiceSocket.emit('voice.signal', { targetUserId, signal: pc.localDescription });
         } catch(e) {
            console.error("Negotiation error", e);
         }
      };

      if (initiator) {
        pc.createOffer().then(offer => {
          if (pc.signalingState !== 'stable') return;
          pc.setLocalDescription(offer);
          voiceSocket.emit('voice.signal', {
            targetUserId,
            signal: offer
          });
        }).catch(e => console.error("Offer creation error", e));
      }

      return pc;
    };

    const handleUserJoined = (data: { userId: string }) => {
      if (data.userId === userId) return;
      console.log("WebRTC: user joined", data.userId);
      const pc = createPeer(data.userId, true);
      peersRef.current.set(data.userId, pc);
    };

    const handleUserLeft = (data: { userId: string }) => {
      console.log("WebRTC: user left", data.userId);
      if (peersRef.current.has(data.userId)) {
        peersRef.current.get(data.userId)?.close();
        peersRef.current.delete(data.userId);
      }
      setRemoteStreams(prev => {
        const map = new Map(prev);
        map.delete(data.userId);
        return map;
      });
    };

    const handleSignal = async (data: { fromUserId: string, signal: any }) => {
      if (data.fromUserId === userId) return;
      
      let pc = peersRef.current.get(data.fromUserId);
      const isOffer = data.signal.type === 'offer';

      if (!pc) {
        pc = createPeer(data.fromUserId, false);
        peersRef.current.set(data.fromUserId, pc);
      }

      try {
        if (data.signal.type === 'offer') {
           if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
             console.warn("Ignoring offer while in state", pc.signalingState);
             return;
           }
           await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
           const answer = await pc.createAnswer();
           await pc.setLocalDescription(answer);
           voiceSocket.emit('voice.signal', {
             targetUserId: data.fromUserId,
             signal: answer
           });
           
           // Process queued candidates
           const pending = pendingCandidatesRef.current.get(data.fromUserId) || [];
           for (const candidate of pending) {
             try {
               await pc.addIceCandidate(new RTCIceCandidate(candidate));
             } catch (e) {
               console.error("Error adding queued candidate", e);
             }
           }
           pendingCandidatesRef.current.delete(data.fromUserId);
        } else if (data.signal.type === 'answer') {
           if (pc.signalingState === 'have-local-offer') {
             await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
             
             // Process queued candidates
             const pending = pendingCandidatesRef.current.get(data.fromUserId) || [];
             for (const candidate of pending) {
               try {
                 await pc.addIceCandidate(new RTCIceCandidate(candidate));
               } catch (e) {
                 console.error("Error adding queued candidate", e);
               }
             }
             pendingCandidatesRef.current.delete(data.fromUserId);
           }
        } else if (data.signal.type === 'candidate' && data.signal.candidate) {
           if (pc.remoteDescription) {
             await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
           } else {
             const pending = pendingCandidatesRef.current.get(data.fromUserId) || [];
             pending.push(data.signal.candidate);
             pendingCandidatesRef.current.set(data.fromUserId, pending);
           }
        }
      } catch (err) {
        console.error("WebRTC Error parsing signal from user", data.fromUserId, err);
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
