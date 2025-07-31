// Утилиты для WebRTC

export const checkWebRTCSupport = () => {
  if (!window.RTCPeerConnection) {
    throw new Error('WebRTC не поддерживается в этом браузере');
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia не поддерживается в этом браузере');
  }
  
  return true;
};

export const requestMediaPermissions = async (type = 'audio') => {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      },
      video: type === 'video' ? {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 },
        facingMode: 'user'
      } : false
    };

    console.log('Requesting permissions with constraints:', constraints);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Permissions granted, stream:', stream);
    
    // Останавливаем stream после получения разрешений
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Permission denied:', error);
    
    let errorMessage = 'Ошибка доступа к медиа устройствам';
    
    switch (error.name) {
      case 'NotAllowedError':
        errorMessage = 'Доступ к камере/микрофону запрещен. Разрешите доступ в настройках браузера.';
        break;
      case 'NotFoundError':
        errorMessage = 'Камера или микрофон не найдены. Проверьте подключение устройств.';
        break;
      case 'NotSupportedError':
        errorMessage = 'Ваш браузер не поддерживает WebRTC.';
        break;
      case 'NotReadableError':
        errorMessage = 'Камера или микрофон заняты другим приложением.';
        break;
      case 'OverconstrainedError':
        errorMessage = 'Неподдерживаемые настройки камеры/микрофона.';
        break;
      default:
        errorMessage = `Ошибка: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const getOptimalConstraints = (callType) => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1
    },
    video: callType === 'video' ? {
      width: { min: 320, ideal: 640, max: 1280 },
      height: { min: 240, ideal: 480, max: 720 },
      frameRate: { min: 15, ideal: 30, max: 30 },
      facingMode: 'user'
    } : false
  };
};

export const handleWebRTCError = (error) => {
  console.error('WebRTC Error:', error);
  
  let userMessage = 'Произошла ошибка во время звонка';
  
  if (error.message?.includes('Permission')) {
    userMessage = 'Нет доступа к камере/микрофону';
  } else if (error.message?.includes('network')) {
    userMessage = 'Проблемы с сетевым соединением';
  } else if (error.message?.includes('ice')) {
    userMessage = 'Не удается установить соединение';
  }
  
  return userMessage;
};