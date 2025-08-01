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
  const [networkQuality, setNetworkQuality] = useState('good'); // 'excellent', 'good', 'poor', 'bad'
  const [connectionStats, setConnectionStats] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // ICE серверы для WebRTC
  // Пул публичных STUN/TURN-узлов (можно легко заменить на свои)
  const iceServers = {
    iceServers: [
      // Google STUN
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },

      // OpenRelay (Канада / NL)
      { urls: 'turn:global.relay.metered.ca:80',   username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:global.relay.metered.ca:443',  username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:global.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },

      // EXPRESSTURN (USA / EU) — демо-учётка 1 Мбит/с
      { urls: 'turn:relay1.expressturn.com:3478',               username: 'ef727d', credential: 'webrtcdemo' },
      { urls: 'turn:relay1.expressturn.com:443?transport=tcp',  username: 'ef727d', credential: 'webrtcdemo' },

      // AnyFirewall (Германия) — общественный TCP-TURN
      { urls: 'turn:turn.anyfirewall.com:443?transport=tcp',    username: 'webrtc', credential: 'webrtc' }
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

  // Мониторинг качества сети (улучшенная версия)
  const updateNetworkQuality = async () => {
    if (!peerConnectionRef.current) return;
    
    try {
      const stats = await peerConnectionRef.current.getStats();
      let bytesReceived = 0;
      let bytesSent = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let jitter = 0;
      let roundTripTime = 0;
      let audioBytes = 0;
      let videoBytes = 0;
      let connectionType = 'unknown';
      
      stats.forEach(stat => {
        // Входящий трафик
        if (stat.type === 'inbound-rtp') {
          bytesReceived += stat.bytesReceived || 0;
          packetsLost += stat.packetsLost || 0;
          packetsReceived += stat.packetsReceived || 0;
          jitter = Math.max(jitter, stat.jitter || 0);
          
          if (stat.mediaType === 'audio') {
            audioBytes += stat.bytesReceived || 0;
          } else if (stat.mediaType === 'video') {
            videoBytes += stat.bytesReceived || 0;
          }
        }
        
        // Исходящий трафик
        if (stat.type === 'outbound-rtp') {
          bytesSent += stat.bytesSent || 0;
        }
        
        // Информация о соединении
        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          roundTripTime = stat.currentRoundTripTime * 1000 || 0; // в миллисекундах
        }
        
        // Тип соединения
        if (stat.type === 'local-candidate' && stat.candidateType) {
          connectionType = stat.candidateType; // 'host', 'srflx', 'relay'
        }
      });
      
      const lossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
      
      // Улучшенная логика определения качества
      let quality = 'excellent';
      if (lossRate > 8 || roundTripTime > 300 || jitter > 0.03) {
        quality = 'poor';
      } else if (lossRate > 4 || roundTripTime > 200 || jitter > 0.02) {
        quality = 'fair';
      } else if (lossRate > 1 || roundTripTime > 100 || jitter > 0.01) {
        quality = 'good';
      }
      
      setNetworkQuality(quality);
      setConnectionStats({ 
        bytesReceived, 
        bytesSent, 
        packetsLost, 
        lossRate: Math.round(lossRate * 100) / 100,
        jitter: Math.round(jitter * 1000 * 100) / 100, // в миллисекундах
        roundTripTime: Math.round(roundTripTime),
        audioBytes,
        videoBytes,
        connectionType
      });
      
    } catch (error) {
      console.log('Stats error:', error);
    }
  };

  // Периодическое обновление статистики
  useEffect(() => {
    if (callStatus === 'accepted') {
      const interval = setInterval(updateNetworkQuality, 2000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      console.log('CallInterface unmounting - cleanup');
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!socket || !call) return;

    // WebRTC события
    socket.on('webrtc-offer', handleReceiveOffer);
    socket.on('webrtc-answer', handleReceiveAnswer);
    socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callDeclined', handleCallDeclined);
    socket.on('callEnded', handleCallEnded);
    socket.on('call-video-upgrade', handleVideoUpgrade);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callDeclined', handleCallDeclined);
      socket.off('callEnded', handleCallEnded);
      socket.off('call-video-upgrade', handleVideoUpgrade);
    };
  }, [socket, call]);

  const handleVideoUpgrade = ({ callId, userId }) => {
    if (callId !== call?._id) return;
    
    console.log('Участник звонка включил видео:', userId);
    // Показываем уведомление или обновляем UI
    // В будущем можно добавить всплывающее уведомление
  };

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
    console.log('Call declined via socket');
    setCallStatus('declined');
    cleanupCall();
  };

  const handleCallEnded = () => {
    console.log('Call ended via socket');
    setCallStatus('ended');
    cleanupCall();
    
    // Дополнительная очистка через 1 секунду на всякий случай
    setTimeout(() => {
      cleanupCall();
    }, 1000);
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
    
    // ПРИНУДИТЕЛЬНО останавливаем ВСЕ медиа треки
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.enabled);
        track.stop(); // Останавливаем трек
        track.enabled = false; // Выключаем трек
      });
      localStreamRef.current = null;
    }
    
    // Останавливаем удаленные треки тоже
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const remoteStream = remoteVideoRef.current.srcObject;
      remoteStream.getTracks().forEach(track => {
        console.log('Stopping remote track:', track.kind);
        track.stop();
      });
    }
    
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      const remoteAudioStream = remoteAudioRef.current.srcObject;
      remoteAudioStream.getTracks().forEach(track => {
        console.log('Stopping remote audio track:', track.kind);
        track.stop();
      });
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
      localVideoRef.current.pause();
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
    
    // Сбрасываем состояния кнопок
    setIsAudioEnabled(true);
    setIsVideoEnabled(call?.type === 'video');
    setCallStatus('ended');
    
    console.log('Call cleanup completed - ALL TRACKS STOPPED');
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

  const toggleVideo = async () => {
    if (call?.type === 'audio' && !isVideoEnabled) {
      // Включаем камеру в аудио звонке
      try {
        console.log('Upgrading audio call to video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        
        // Заменяем старый stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        localStreamRef.current = stream;
        
        // Обновляем peer connection
        if (peerConnectionRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            peerConnectionRef.current.addTrack(videoTrack, stream);
          }
        }
        
        // Показываем локальное видео
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(e => console.log('Local video autoplay prevented'));
        }
        
        setIsVideoEnabled(true);
        
        // Уведомляем другого пользователя
        socket.emit('call-video-upgrade', {
          callId: call._id,
          targetUserId: getTargetUserId()
        });
        
      } catch (error) {
        console.error('Failed to enable video:', error);
        alert('Не удалось включить камеру');
      }
    } else if (localStreamRef.current) {
      // Обычное переключение видео
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
    
    // Определяем с кем ведется разговор (не кто звонит, а с кем говорим)
    if (call?.caller?._id === currentUserId) {
      // Я звоню кому-то - показываем имя получателя
      return call?.callee?.username || 'Неизвестный';
    } else {
      // Мне звонят - показываем имя звонящего
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
              
              {/* Индикатор качества сети */}
              {callStatus === 'accepted' && (
                <div className={`network-quality ${networkQuality}`}>
                  <div className="signal-bars">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                  <div className="quality-info">
                    <span className="quality-text">
                      {networkQuality === 'excellent' && 'Отличное'}
                      {networkQuality === 'good' && 'Хорошее'}
                      {networkQuality === 'fair' && 'Среднее'}
                      {networkQuality === 'poor' && 'Слабое'}
                    </span>
                    {connectionStats && (
                      <div className="connection-details">
                        {connectionStats.roundTripTime > 0 && (
                          <span className="stat">Ping: {connectionStats.roundTripTime}мс</span>
                        )}
                        {connectionStats.lossRate > 0 && (
                          <span className="stat">Потери: {connectionStats.lossRate}%</span>
                        )}
                        {connectionStats.jitter > 0 && (
                          <span className="stat">Jitter: {connectionStats.jitter}мс</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {((call.type === 'video') || (call.type === 'audio' && isVideoEnabled)) && callStatus === 'accepted' && (
            <div className="call-type-indicator">
              <Video size={16} />
              <span>{call.type === 'audio' ? 'Видео включено' : 'Видео звонок'}</span>
            </div>
          )}
        </div>

        {/* Аудио элемент для звука (всегда присутствует) */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          style={{ display: 'none' }}
        />

        {((call.type === 'video') || (call.type === 'audio' && isVideoEnabled)) && callStatus === 'accepted' && (
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
            {call.type === 'audio' && (
              <div className="upgraded-call-indicator">
                <span>Видео включено</span>
              </div>
            )}
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
              
              {/* Кнопка видео для всех типов звонков */}
              <button 
                onClick={toggleVideo}
                className={`call-control-btn ${isVideoEnabled ? 'active' : 'inactive'} ${call.type === 'audio' && !isVideoEnabled ? 'upgrade-btn' : ''}`}
                title={
                  call.type === 'audio' && !isVideoEnabled 
                    ? 'Включить камеру (улучшить до видео)' 
                    : isVideoEnabled 
                      ? 'Выключить камеру' 
                      : 'Включить камеру'
                }
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                {call.type === 'audio' && !isVideoEnabled && (
                  <span className="upgrade-text">Видео</span>
                )}
              </button>
              
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
                onClick={async () => {
                  console.log('FORCE END CALL - stopping everything');
                  // Принудительно очищаем всё локально
                  cleanupCall();
                  // Затем вызываем API
                  await endCall();
                }}
                className="call-control-btn end-call-btn"
                title="Завершить звонок"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          ) : (
            <div className="call-ended-controls">
              <button 
                onClick={() => {
                  console.log('Closing call interface');
                  cleanupCall(); // Дополнительная очистка
                  window.location.reload(); // Принудительная перезагрузка
                }}
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