import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, VolumeX, Volume2 } from 'lucide-react';

const CallInterface = ({ 
  call, 
  onEndCall, 
  onAcceptCall, 
  onDeclineCall, 
  isIncoming = false,
  socket 
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call?.type === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState(call?.status || 'pending');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // ICE серверы для WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (callStatus === 'accepted') {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  useEffect(() => {
    if (!socket || !call) return;

    // WebRTC события
    socket.on('webrtc-offer', handleReceiveOffer);
    socket.on('webrtc-answer', handleReceiveAnswer);
    socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callDeclined', handleCallDeclined);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callDeclined', handleCallDeclined);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket, call]);

  const handleReceiveOffer = async ({ callId, offer, fromUserId }) => {
    if (callId !== call?._id) return;
    
    try {
      await createPeerConnection();
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      const stream = await getUserMedia();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        callId: call._id,
        answer: answer,
        targetUserId: fromUserId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async ({ callId, answer }) => {
    if (callId !== call?._id) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async ({ callId, candidate }) => {
    if (callId !== call?._id) return;
    
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleCallAccepted = () => {
    setCallStatus('accepted');
  };

  const handleCallDeclined = () => {
    setCallStatus('declined');
    cleanupCall();
  };

  const handleCallEnded = () => {
    setCallStatus('ended');
    cleanupCall();
  };

  const createPeerConnection = async () => {
    peerConnectionRef.current = new RTCPeerConnection(iceServers);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          callId: call._id,
          candidate: event.candidate,
          targetUserId: getTargetUserId()
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  const getUserMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: call?.type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && call?.type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const getTargetUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;
    return call?.caller?._id === currentUserId ? call?.callee?._id : call?.caller?._id;
  };

  const startCall = async () => {
    try {
      await createPeerConnection();
      const stream = await getUserMedia();
      
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        callId: call._id,
        offer: offer,
        targetUserId: getTargetUserId()
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const acceptCall = async () => {
    try {
      await onAcceptCall();
      await startCall();
      setCallStatus('accepted');
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const declineCall = () => {
    onDeclineCall();
    setCallStatus('declined');
  };

  const endCall = () => {
    onEndCall();
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        socket.emit('call-audio-toggle', {
          callId: call._id,
          isAudioEnabled: audioTrack.enabled,
          targetUserId: getTargetUserId()
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && call?.type === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        socket.emit('call-video-toggle', {
          callId: call._id,
          isVideoEnabled: videoTrack.enabled,
          targetUserId: getTargetUserId()
        });
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'pending':
        return isIncoming ? 'Входящий звонок...' : 'Соединение...';
      case 'accepted':
        return `Разговор ${formatDuration(callDuration)}`;
      case 'declined':
        return 'Звонок отклонен';
      case 'ended':
        return 'Звонок завершен';
      default:
        return 'Звонок';
    }
  };

  const getCallerName = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;
    
    if (call?.caller?._id === currentUserId) {
      return call?.callee?.username || 'Неизвестный';
    } else {
      return call?.caller?.username || 'Неизвестный';
    }
  };

  if (!call) return null;

  return (
    <div className="call-interface-overlay">
      <div className="call-interface">
        <div className="call-header">
          <div className="call-user-info">
            <div className="call-avatar">
              {getCallerName().charAt(0).toUpperCase()}
            </div>
            <div className="call-details">
              <h3 className="call-username">{getCallerName()}</h3>
              <p className="call-status">{getCallStatusText()}</p>
            </div>
          </div>
          
          {call.type === 'video' && callStatus === 'accepted' && (
            <div className="call-type-indicator">
              <Video size={16} />
              <span>Видео звонок</span>
            </div>
          )}
        </div>

        {call.type === 'video' && callStatus === 'accepted' && (
          <div className="video-container">
            <video
              ref={remoteVideoRef}
              className="remote-video"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="local-video"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        <div className="call-controls">
          {callStatus === 'pending' && isIncoming ? (
            <div className="incoming-call-controls">
              <button 
                onClick={declineCall}
                className="call-control-btn decline-btn"
              >
                <PhoneOff size={24} />
              </button>
              <button 
                onClick={acceptCall}
                className="call-control-btn accept-btn"
              >
                <Phone size={24} />
              </button>
            </div>
          ) : callStatus === 'accepted' ? (
            <div className="active-call-controls">
              <button 
                onClick={toggleAudio}
                className={`call-control-btn ${isAudioEnabled ? 'active' : 'inactive'}`}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              
              {call.type === 'video' && (
                <button 
                  onClick={toggleVideo}
                  className={`call-control-btn ${isVideoEnabled ? 'active' : 'inactive'}`}
                >
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              )}
              
              <button 
                onClick={endCall}
                className="call-control-btn end-call-btn"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          ) : (
            <div className="call-ended-controls">
              <button 
                onClick={() => window.location.reload()}
                className="call-control-btn"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallInterface;