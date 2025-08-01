import React from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOff, Video, VideoOff } from 'lucide-react';
import './CallMessage.css';

const CallMessage = ({ 
  message, 
  isOwn, 
  onRetryCall,
  activeChat,
  user 
}) => {
  const { callData } = message;
  
  // Определяем тип и статус звонка
  const isIncoming = callData?.direction === 'incoming';
  const isAnswered = callData?.status === 'answered';
  const isMissed = callData?.status === 'missed';
  const isDeclined = callData?.status === 'declined';
  const isVideo = callData?.callType === 'video';
  
  // Выбираем иконку
  const getCallIcon = () => {
    if (isVideo) {
      if (isMissed || isDeclined) return <VideoOff size={18} />;
      return <Video size={18} />;
    }
    
    if (isIncoming) {
      if (isMissed) return <PhoneMissed size={18} />;
      if (isAnswered) return <PhoneIncoming size={18} />;
      return <PhoneIncoming size={18} />;
    } else {
      if (isDeclined) return <PhoneOff size={18} />;
      return <PhoneCall size={18} />;
    }
  };
  
  // Выбираем цвет иконки
  const getIconColor = () => {
    if (isMissed) return '#f56565'; // красный
    if (isDeclined) return '#f56565'; // красный
    if (isAnswered) return '#48bb78'; // зеленый
    if (isIncoming) return '#4299e1'; // синий
    return '#805ad5'; // фиолетовый для исходящих
  };
  
  // Текст статуса
  const getCallStatusText = () => {
    if (isIncoming) {
      if (isMissed) return 'Пропущенный звонок';
      if (isAnswered) return isVideo ? 'Входящий видеозвонок' : 'Входящий звонок';
      return isVideo ? 'Входящий видеозвонок' : 'Входящий звонок';
    } else {
      if (isDeclined) return 'Отклоненный звонок';
      if (isAnswered) return isVideo ? 'Исходящий видеозвонок' : 'Исходящий звонок';
      return isVideo ? 'Исходящий видеозвонок' : 'Исходящий звонок';
    }
  };
  
  // Форматирование длительности
  const formatDuration = (duration) => {
    if (!duration) return null;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Обработчик повторного звонка
  const handleRetryCall = () => {
    if (onRetryCall && (isMissed || isDeclined)) {
      const otherUser = activeChat.participants.find(p => p._id !== (user._id || user.id));
      if (otherUser) {
        onRetryCall(otherUser._id, callData?.callType || 'audio');
      }
    }
  };
  
  const shouldShowRetry = (isMissed || isDeclined) && onRetryCall;
  
  return (
    <div className={`call-message-bubble ${isOwn ? 'own' : 'other'} ${shouldShowRetry ? 'clickable' : ''}`}
         onClick={shouldShowRetry ? handleRetryCall : undefined}>
      <div className="call-message-header">
        <div className="call-icon-wrapper" style={{ color: getIconColor() }}>
          {getCallIcon()}
        </div>
        <div className="call-status-text">
          {getCallStatusText()}
        </div>
      </div>
      
      <div className="call-message-details">
        {isAnswered && callData?.duration ? (
          <div className="call-duration">
            <span className="duration-text">{formatDuration(callData.duration)}</span>
          </div>
        ) : (
          <div className="call-no-answer">
            {isMissed ? 'Не отвечен' : isDeclined ? 'Отклонен' : 'Не отвечен'}
          </div>
        )}
        
        <div className="call-time">
          {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      
      {shouldShowRetry && (
        <div className="call-retry-hint">
          <Phone size={14} />
          <span>Нажмите для повторного звонка</span>
        </div>
      )}
    </div>
  );
};

export default CallMessage;