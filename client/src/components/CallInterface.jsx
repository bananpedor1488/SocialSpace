import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Settings, Info, ChevronDown } from 'lucide-react';
import { checkWebRTCSupport, requestMediaPermissions, getOptimalConstraints, handleWebRTCError } from '../utils/webrtc';
import Avatar from './Avatar';

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
  const pendingOfferRef = useRef(null);

  // ICE серверы для WebRTC
  // Профили ICE-серверов для переключения во время звонка
  const ICE_PROFILES = {
    auto: [
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
    ],
    
    openrelay: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:global.relay.metered.ca:80',   username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:global.relay.metered.ca:443',  username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:global.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
    ],
    
    expressturn: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:relay1.expressturn.com:3478',               username: 'ef727d', credential: 'webrtcdemo' },
      { urls: 'turn:relay1.expressturn.com:443?transport=tcp',  username: 'ef727d', credential: 'webrtcdemo' }
    ],
    
    anyfirewall: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:turn.anyfirewall.com:443?transport=tcp',    username: 'webrtc', credential: 'webrtc' }
    ]
  };

  const [serverKey, setServerKey] = useState('auto');
  const [serverPing, setServerPing] = useState(null);
  const [connectionType, setConnectionType] = useState('unknown');
  const [dataReceived, setDataReceived] = useState(0);
  const [dataSent, setDataSent] = useState(0);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showServerSelector, setShowServerSelector] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Динамическая ICE-конфигурация
  const currentIceConfig = useMemo(() => ({
    iceServers: ICE_PROFILES[serverKey] || ICE_PROFILES.auto
  }), [serverKey]);

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
      let audioLevel = 0;
      
      stats.forEach(stat => {
        // Входящий трафик
        if (stat.type === 'inbound-rtp') {
          bytesReceived += stat.bytesReceived || 0;
          packetsLost += stat.packetsLost || 0;
          packetsReceived += stat.packetsReceived || 0;
          jitter = Math.max(jitter, stat.jitter || 0);
          
          if (stat.mediaType === 'audio') {
            audioBytes += stat.bytesReceived || 0;
            // Детекция звука собеседника
            audioLevel = stat.audioLevel || 0;
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
      
      // Детекция активности звука (если есть входящий аудио трафик)
      setIsSpeaking(audioBytes > 0 && audioLevel > 0.01);
      
      const lossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
      
      // Обновляем метрики в реальном времени
      setServerPing(Math.round(roundTripTime));
      setConnectionType(connectionType);
      setDataReceived(bytesReceived);
      setDataSent(bytesSent);
      
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

  // Автоматическое закрытие при ошибке
  useEffect(() => {
    if (callStatus === 'failed') {
      console.log('Call failed, closing interface in 3 seconds');
      setTimeout(() => {
        onEndCall();
      }, 3000);
    }
  }, [callStatus, onEndCall]);

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
    
    // Обработка смены ICE-профиля
    const handleServerChange = async ({ callId, serverKey }) => {
      if (callId !== call._id) return;
      console.log(`Received server change request to: ${serverKey}`);
      await switchIceProfile(serverKey);
    };
    
    socket.on('webrtc-change-server', handleServerChange);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callDeclined', handleCallDeclined);
      socket.off('callEnded', handleCallEnded);
      socket.off('call-video-upgrade', handleVideoUpgrade);
      socket.off('webrtc-change-server', handleServerChange);
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
      
      // Сохраняем offer для использования после принятия звонка
      pendingOfferRef.current = { offer, fromUserId };
      
      console.log('Offer saved, waiting for user to accept call');
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
    console.log('Call accepted event received');
    setCallStatus('accepted');
    
    // Запускаем таймер продолжительности звонка
    if (!callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
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
    peerConnectionRef.current = new RTCPeerConnection(currentIceConfig);

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
      console.log('🎵 Received remote track:', event.track.kind, 'from streams:', event.streams.length);
      console.log('Track enabled:', event.track.enabled);
      console.log('Track readyState:', event.track.readyState);
      
      if (event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('Remote stream ID:', remoteStream.id);
        console.log('Stream has audio tracks:', remoteStream.getAudioTracks().length);
        console.log('Stream has video tracks:', remoteStream.getVideoTracks().length);
        
        // Для видео звонков
        if (call?.type === 'video' && remoteVideoRef.current && remoteStream.getVideoTracks().length > 0) {
          console.log('🎥 Assigning remote video stream');
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.autoplay = true;
          remoteVideoRef.current.playsInline = true;
          
          // Принудительно включаем воспроизведение
          remoteVideoRef.current.play().then(() => {
            console.log('✅ Remote video playing successfully');
          }).catch(e => {
            console.log('❌ Video autoplay prevented:', e.message);
          });
        }
        
        // Для аудио (всегда, включая видео звонки)
        if (remoteAudioRef.current && remoteStream.getAudioTracks().length > 0) {
          console.log('🔊 Assigning remote audio stream');
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.autoplay = true;
          
          // Принудительно включаем воспроизведение звука
          remoteAudioRef.current.play().then(() => {
            console.log('✅ Remote audio playing successfully');
          }).catch(e => {
            console.log('❌ Audio autoplay prevented:', e.message);
            // Показываем пользователю кнопку для включения звука
            setCallStatus('needs-interaction');
          });
        }
      } else {
        console.warn('⚠️ No streams received in ontrack event');
      }
    };
  };

  const getUserMedia = async () => {
    try {
      console.log('Getting user media for call type:', call?.type);
      
      // Проверяем поддержку WebRTC
      checkWebRTCSupport();

      const constraints = getOptimalConstraints(call?.type);
      console.log('Requesting media with constraints:', constraints);
      
      // Запрашиваем разрешения явно
      await requestMediaPermissions(constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      console.log('Media stream obtained successfully:', stream);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      console.log('Video tracks:', stream.getVideoTracks().length);

      // Настраиваем локальное видео
      if (localVideoRef.current && call?.type === 'video' && stream.getVideoTracks().length > 0) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Важно для локального видео
        localVideoRef.current.play().catch(e => console.log('Local video autoplay prevented:', e));
        console.log('Local video assigned');
      }
      
      // Проверяем треки
      stream.getAudioTracks().forEach((track, index) => {
        console.log(`Audio track ${index} - enabled:`, track.enabled, 'muted:', track.muted);
        track.enabled = isAudioEnabled; // Применяем текущее состояние
      });
      
      stream.getVideoTracks().forEach((track, index) => {
        console.log(`Video track ${index} - enabled:`, track.enabled, 'muted:', track.muted);
        track.enabled = isVideoEnabled; // Применяем текущее состояние
      });

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      const errorMessage = handleWebRTCError(error);
      alert(`Ошибка доступа к микрофону/камере: ${errorMessage}`);
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

  const processStoredOffer = async () => {
    if (!pendingOfferRef.current) {
      console.log('No pending offer to process');
      return;
    }
    
    const { offer, fromUserId } = pendingOfferRef.current;
    
    try {
      console.log('Processing stored offer after call acceptance');
      
      // Очищаем существующее соединение если есть
      if (peerConnectionRef.current) {
        console.log('Closing existing peer connection before creating new one');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      await createPeerConnection();
      
      console.log('Getting user media BEFORE setting remote description...');
      const stream = await getUserMedia();
      
      console.log('Adding tracks BEFORE setting remote description...');
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, track);
        peerConnectionRef.current.addTrack(track, stream);
      });
      
      console.log('Setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

      console.log('Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      console.log('Sending answer...');
      socket.emit('webrtc-answer', {
        callId: call._id,
        answer: answer,
        targetUserId: fromUserId
      });
      
      // Очищаем сохраненный offer
      pendingOfferRef.current = null;
      
      console.log('Stored offer processed successfully');
    } catch (error) {
      console.error('Error processing stored offer:', error);
      setCallStatus('failed');
    }
  };

  const acceptCall = async () => {
    try {
      await onAcceptCall();
      setCallStatus('accepted');
      
      // Обрабатываем сохраненный offer если это входящий звонок
      if (isIncoming && pendingOfferRef.current) {
        await processStoredOffer();
      } else {
        // Для исходящих звонков запускаем обычный процесс
        await startCall();
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const declineCall = () => {
    // Очищаем сохраненный offer при отклонении
    pendingOfferRef.current = null;
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

  const enableAudio = async () => {
    try {
      if (remoteAudioRef.current) {
        await remoteAudioRef.current.play();
        console.log('✅ Audio enabled successfully by user interaction');
        setCallStatus('accepted');
      }
    } catch (error) {
      console.error('Failed to enable audio:', error);
    }
  };

  // Функция переключения ICE-профиля во время звонка
  const switchIceProfile = async (newKey) => {
    if (newKey === serverKey || callStatus !== 'accepted') return;
    
    console.log(`Switching ICE profile from ${serverKey} to ${newKey}`);
    setServerKey(newKey);

    const targetUserId = getTargetUserId();

    try {
      // 1. Закрываем старое соединение
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // 2. Создаём заново с новым профилем
      await createPeerConnection();

      // 3. Добавляем существующие треки
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        });
      }

      // 4. Создаём новый offer с iceRestart
      const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
      await peerConnectionRef.current.setLocalDescription(offer);

      // 5. Отправляем offer и уведомление о смене профиля
      socket.emit('webrtc-offer', {
        callId: call._id,
        offer: offer,
        targetUserId: targetUserId
      });

      socket.emit('webrtc-change-server', {
        callId: call._id,
        serverKey: newKey,
        targetUserId: targetUserId
      });

      console.log(`ICE profile switched to ${newKey}`);
    } catch (error) {
      console.error('Error switching ICE profile:', error);
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
    
    // Очищаем сохраненный offer
    pendingOfferRef.current = null;
    
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
      case 'failed':
        return 'Ошибка соединения';
      case 'needs-interaction':
        return 'Нажмите для включения звука';
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

  const getCallerAvatar = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;
    
    // Получаем аватарку собеседника
    if (call?.caller?._id === currentUserId) {
      return call?.callee?.avatar;
    } else {
      return call?.caller?.avatar;
    }
  };

  if (!call) return null;

  return (
    <div className="call-interface-overlay">
      <div className="call-interface" style={{ position: 'relative' }}>
        <div className="call-header">
          <div className="call-user-info">
            <div className={`call-avatar-container ${callStatus === 'pending' ? 'calling' : ''} ${isSpeaking ? 'speaking' : ''}`}>
              <Avatar 
                src={getCallerAvatar()}
                alt={getCallerName()}
                size="xlarge"
                className="call-avatar"
              />
            </div>
            <div className="call-details">
              <h3 className="call-username">{getCallerName()}</h3>
              <p className="call-status">{getCallStatusText()}</p>
              
              {/* Контролы в правом верхнем углу */}
              {callStatus === 'accepted' && (
                <div className="call-top-controls">
                  {/* Кнопка выбора сервера */}
                  <div className="server-selector-dropdown">
                    <button 
                      className="server-btn"
                      onClick={() => setShowServerSelector(!showServerSelector)}
                      title="Выбор TURN/STUN сервера"
                    >
                      <Settings size={14} />
                      <span className="server-name">
                        {serverKey === 'auto' ? 'Auto' : 
                         serverKey === 'openrelay' ? 'OpenRelay' :
                         serverKey === 'expressturn' ? 'ExpressTurn' :
                         serverKey === 'anyfirewall' ? 'AnyFirewall' : 'Auto'}
                      </span>
                      <ChevronDown size={12} />
                    </button>
                    
                    {showServerSelector && (
                      <div className="server-dropdown">
                        <div className="dropdown-option" onClick={() => { switchIceProfile('auto'); setShowServerSelector(false); }}>
                          Auto (Все)
                        </div>
                        <div className="dropdown-option" onClick={() => { switchIceProfile('openrelay'); setShowServerSelector(false); }}>
                          OpenRelay
                        </div>
                        <div className="dropdown-option" onClick={() => { switchIceProfile('expressturn'); setShowServerSelector(false); }}>
                          ExpressTurn
                        </div>
                        <div className="dropdown-option" onClick={() => { switchIceProfile('anyfirewall'); setShowServerSelector(false); }}>
                          AnyFirewall
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кнопка расширенной информации */}
                  <button 
                    className="info-btn"
                    onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                    title="Подробная информация о соединении"
                  >
                    <Info size={14} />
                  </button>
                </div>
              )}

              {/* Расширенные метрики (показываются по клику) */}
              {callStatus === 'accepted' && showAdvancedMetrics && (
                <div className="connection-metrics">
                  <div className="metric ping">
                    <span className="metric-label">📡</span>
                    <span className={`metric-value ${serverPing > 200 ? 'poor' : serverPing > 100 ? 'fair' : 'good'}`}>
                      {serverPing ? `${serverPing}ms` : '---'}
                    </span>
                  </div>
                  <div className="metric connection">
                    <span className="metric-label">🔗</span>
                    <span className="metric-value">
                      {connectionType === 'relay' ? 'TURN' : 
                       connectionType === 'srflx' ? 'STUN' : 
                       connectionType === 'host' ? 'P2P' : '?'}
                    </span>
                  </div>
                  <div className="metric data">
                    <span className="metric-label">📊</span>
                    <span className="metric-value">
                      ↓{(dataReceived / 1024 / 1024).toFixed(1)} ↑{(dataSent / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                </div>
              )}

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
              onLoadedMetadata={() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.style.objectFit = 'cover';
                  remoteVideoRef.current.style.width = '100%';
                  remoteVideoRef.current.style.height = '100%';
                }
              }}
            />
            <video
              ref={localVideoRef}
              className="local-video"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (localVideoRef.current) {
                  localVideoRef.current.style.objectFit = 'cover';
                }
              }}
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
          ) : callStatus === 'needs-interaction' ? (
            <div className="interaction-needed-controls">
              <button 
                onClick={enableAudio}
                className="call-control-btn accept-btn"
                title="Включить звук"
              >
                <Volume2 size={24} />
                <span>Включить звук</span>
              </button>
              <button 
                onClick={endCall}
                className="call-control-btn end-call-btn"
              >
                <PhoneOff size={24} />
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