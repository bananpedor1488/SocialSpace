import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, VolumeX, Volume2 } from 'lucide-react';
import { checkWebRTCSupport, requestMediaPermissions, getOptimalConstraints, handleWebRTCError } from '../utils/webrtc';

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
  const remoteAudioRef = useRef(null);
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

  // Автоматически начинаем звонок для инициатора
  useEffect(() => {
    if (call && !isIncoming && socket && callStatus === 'pending') {
      console.log('Auto-starting call for initiator');
      startCall();
    }
  }, [call, isIncoming, socket, callStatus]);

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
      console.log('Received offer:', offer);
      await createPeerConnection();
      
      console.log('Setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('Getting user media...');
      const stream = await getUserMedia();
      
      console.log('Adding tracks...');
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, track);
        peerConnectionRef.current.addTrack(track, stream);
      });

      console.log('Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      console.log('Sending answer...');
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
        const targetUserId = getTargetUserId();
        console.log('Sending ICE candidate to:', targetUserId);
        socket.emit('webrtc-ice-candidate', {
          callId: call._id,
          candidate: event.candidate,
          targetUserId: targetUserId
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams[0]);
      console.log('Track enabled:', event.track.enabled);
      console.log('Track readyState:', event.track.readyState);
      
      if (event.streams[0]) {
        console.log('Stream has audio tracks:', event.streams[0].getAudioTracks().length);
        console.log('Stream has video tracks:', event.streams[0].getVideoTracks().length);
        
        // Для видео звонков
        if (call?.type === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log('Remote video assigned');
          
          // Принудительно включаем воспроизведение
          remoteVideoRef.current.play().catch(e => {
            console.log('Video autoplay prevented, user interaction required');
          });
        }
        
        // Для аудио (всегда, включая видео звонки)
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.volume = 1.0;
          console.log('Remote audio assigned');
          
          // Принудительно включаем воспроизведение звука
          remoteAudioRef.current.play().catch(e => {
            console.log('Audio autoplay prevented, user interaction required');
          });
        }
      }
    };
  };

  const getUserMedia = async () => {
    try {
      // Проверяем поддержку WebRTC
      checkWebRTCSupport();

      const constraints = getOptimalConstraints(call?.type);
      console.log('Requesting media with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      console.log('Media stream obtained:', stream);
      console.log('Audio tracks:', stream.getAudioTracks());
      console.log('Video tracks:', stream.getVideoTracks());

      // Настраиваем локальное видео
      if (localVideoRef.current && call?.type === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Важно для локального видео
        localVideoRef.current.play().catch(e => console.log('Local video autoplay prevented'));
        console.log('Local video assigned');
      }
      
      // Проверяем треки
      stream.getAudioTracks().forEach(track => {
        console.log('Audio track enabled:', track.enabled);
        console.log('Audio track muted:', track.muted);
      });

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert(handleWebRTCError(error));
      throw error;
    }
  };

  const getTargetUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;
    
    console.log('Current user ID:', currentUserId);
    console.log('Call data:', call);
    console.log('Caller ID:', call?.caller?._id);
    console.log('Callee ID:', call?.callee?._id);
    
    let targetUserId;
    if (call?.caller?._id === currentUserId) {
      targetUserId = call?.callee?._id;
    } else {
      targetUserId = call?.caller?._id;
    }
    
    console.log('Target user ID:', targetUserId);
    return targetUserId;
  };

  const startCall = async () => {
    try {
      console.log('Starting call...');
      await createPeerConnection();
      
      const stream = await getUserMedia();
      
      console.log('Adding tracks to peer connection...');
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, track);
        peerConnectionRef.current.addTrack(track, stream);
      });

      console.log('Creating offer...');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: call?.type === 'video'
      });
      
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Offer created and set as local description');

      console.log('Sending offer via socket...');
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

  const endCall = async () => {
    console.log('Ending call...');
    try {
      await onEndCall();
      cleanupCall();
    } catch (error) {
      console.error('Error ending call:', error);
      // Принудительно очищаем всё равно
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    console.log('Cleaning up call...');
    
    // Останавливаем все медиа треки
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    // Закрываем peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Очищаем таймер
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Очищаем видео и аудио элементы
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    console.log('Call cleanup completed');
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

        {/* Аудио элемент для звука (всегда присутствует) */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          style={{ display: 'none' }}
        />

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
                title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              
              {call.type === 'video' && (
                <button 
                  onClick={toggleVideo}
                  className={`call-control-btn ${isVideoEnabled ? 'active' : 'inactive'}`}
                  title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
                >
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              )}
              
              {/* Кнопка для принудительного включения звука */}
              <button 
                onClick={() => {
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(e => console.log('Manual play failed:', e));
                  }
                }}
                className="call-control-btn active"
                title="Включить звук принудительно"
              >
                <Volume2 size={20} />
              </button>
              
              <button 
                onClick={endCall}
                className="call-control-btn end-call-btn"
                title="Завершить звонок"
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