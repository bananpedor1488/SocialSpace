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
  
  // Добавим логирование для отладки
  console.log('CallMessage rendering:', { isOwn, callData, shouldShowRetry });

  // Inline стили для гарантии отображения  
  const wrapperStyle = {
    margin: '8px 0',
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%'
  };

  const bubbleStyle = {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '280px',
    margin: '0',
    padding: '12px 16px',
    borderRadius: '18px',
    background: isOwn 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: isOwn ? '1px solid #667eea' : '1px solid #f093fb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    position: 'relative',
    marginLeft: isOwn ? 'auto' : '0',
    marginRight: isOwn ? '0' : 'auto',
    cursor: shouldShowRetry ? 'pointer' : 'default'
  };

  return (
    <div className="call-message-wrapper" style={wrapperStyle}>
      <div 
        className={`call-message-bubble ${isOwn ? 'own' : 'other'} ${shouldShowRetry ? 'clickable' : ''}`}
        style={bubbleStyle}
        onClick={shouldShowRetry ? handleRetryCall : undefined}>
        <div className="call-message-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px'
        }}>
          <div className="call-icon-wrapper" style={{ 
            color: getIconColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)'
          }}>
            {getCallIcon()}
          </div>
          <div className="call-status-text" style={{
            fontWeight: '600',
            fontSize: '14px',
            lineHeight: '1.2'
          }}>
            {getCallStatusText()}
          </div>
        </div>
        
        <div className="call-message-details" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          {isAnswered && callData?.duration ? (
            <div className="call-duration" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="duration-text" style={{
                fontWeight: '700',
                fontSize: '16px',
                fontFamily: 'Courier New, monospace'
              }}>{formatDuration(callData.duration)}</span>
            </div>
          ) : (
            <div className="call-no-answer" style={{
              fontSize: '13px',
              opacity: '0.9',
              fontStyle: 'italic'
            }}>
              {isMissed ? 'Не отвечен' : isDeclined ? 'Отклонен' : 'Не отвечен'}
            </div>
          )}
          
          <div className="call-time" style={{
            fontSize: '12px',
            opacity: '0.8',
            whiteSpace: 'nowrap'
          }}>
            {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        {shouldShowRetry && (
          <div className="call-retry-hint" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            opacity: '0.9'
          }}>
            <Phone size={14} />
            <span style={{ fontSize: '11px' }}>Нажмите для повторного звонка</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallMessage;