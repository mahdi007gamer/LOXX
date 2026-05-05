import { useEffect, useRef, useState } from 'react';
import { voiceSocket } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
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
         // Only initiator creates offer again to avoid glare
         if (initiator) {
             try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                voiceSocket.emit('voice.signal', { targetUserId, signal: pc.localDescription });
             } catch(e) {}
         }
      };

      if (initiator) {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          voiceSocket.emit('voice.signal', {
            targetUserId,
            signal: offer
          });
        });
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
        if (data.signal.type === 'offer' || data.signal.type === 'answer') {
           await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
           if (isOffer) {
             const answer = await pc.createAnswer();
             await pc.setLocalDescription(answer);
             voiceSocket.emit('voice.signal', {
               targetUserId: data.fromUserId,
               signal: answer
             });
           }
        } else if (data.signal.type === 'candidate' && data.signal.candidate) {
           await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
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
