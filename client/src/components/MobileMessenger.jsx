import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, MoreVertical, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import OnlineStatus from './OnlineStatus';

const MobileMessenger = ({ 
  chats, 
  activeChat, 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  setActiveChat, 
  loadMessages, 
  messagesLoading, 
  loadingOlderMessages, 
  loadOlderMessages, 
  messagesPagination, 
  totalUnread, 
  initiateCall, 
  getUserStatus, 
  user,
  onViewChange 
}) => {
  const [currentView, setCurrentView] = useState('chats');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onViewChange) {
      onViewChange(currentView);
    }
  }, [currentView, onViewChange]);

  useEffect(() => {
    if (currentView === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    loadMessages(chat._id);
    setCurrentView('chat');
  };

  const handleBackToChats = () => {
    setCurrentView('chats');
    setActiveChat(null);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage();
      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (currentView === 'chats') {
    return (
      <div className="mobile-messenger">
        <div className="mobile-chats-view">
          <div className="mobile-chats-header">
            <h2>Сообщения</h2>
            {totalUnread > 0 && (
              <span className="mobile-chat-unread">{totalUnread}</span>
            )}
          </div>
          
          <div className="mobile-chats-list">
            {chats.length > 0 ? (
              chats
                .sort((a, b) => {
                  const aTime = a.lastMessage?.createdAt || a.lastMessageTime || a.createdAt;
                  const bTime = b.lastMessage?.createdAt || b.lastMessageTime || b.createdAt;
                  return new Date(bTime) - new Date(aTime);
                })
                .map(chat => {
                  const otherUser = chat.participants && chat.participants.length === 2 
                    ? chat.participants.find(p => p._id !== user._id && p._id !== user.id)
                    : null;
                  
                  return (
                    <div 
                      key={chat._id} 
                      className="mobile-chat-item"
                      onClick={() => handleChatSelect(chat)}
                    >
                      <Avatar 
                        src={otherUser?.avatar || null}
                        alt={otherUser?.displayName || otherUser?.username || chat.name}
                        size="medium"
                        className="mobile-chat-avatar"
                      />
                      <div className="mobile-chat-info">
                        <div className="mobile-chat-name">
                          {chat.name}
                          {otherUser?.premium && (
                            <span className="premium-badge">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
                              </svg>
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <div className="mobile-chat-last-message">
                            {chat.lastMessage.sender.username}: {chat.lastMessage.content.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="mobile-chat-unread">{chat.unreadCount}</span>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="mobile-no-chats">
                <MessageCircle className="mobile-no-chats-icon" />
                <h3>Чатов пока нет</h3>
                <p>Начните общение с другими пользователями</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'chat' && activeChat) {
    const otherUser = activeChat.participants && activeChat.participants.length === 2 
      ? activeChat.participants.find(p => p._id !== user._id && p._id !== user.id)
      : null;
    const userStatus = getUserStatus(otherUser?._id);
    const chatMessages = messages[activeChat._id] || [];

    return (
      <div className="mobile-messenger">
        <div className="mobile-chat-view">
          <div className="mobile-chat-header">
            <div className="mobile-chat-header-left">
              <button 
                className="back-btn"
                onClick={handleBackToChats}
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar 
                src={otherUser?.avatar || null}
                alt={otherUser?.displayName || otherUser?.username || 'User'}
                size="medium"
                className="mobile-chat-header-avatar"
              />
              <div className="mobile-chat-header-info">
                <h3>{activeChat.name}</h3>
                <div className="online-status">
                  <OnlineStatus
                    userId={otherUser?._id}
                    isOnline={userStatus.isOnline}
                    lastSeen={userStatus.lastSeen}
                    showText={true}
                    size="small"
                  />
                </div>
              </div>
            </div>
            <div className="mobile-chat-header-actions">
              <button 
                onClick={() => initiateCall('audio')}
                title="Голосовой звонок"
              >
                <Phone size={20} />
              </button>
              <button title="Дополнительно">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
          
          <div className="mobile-messages-area">
            {messagesLoading ? (
              <div className="mobile-loading">
                <div className="mobile-loading-spinner"></div>
                Загрузка сообщений...
              </div>
            ) : (
              <>
                {messagesPagination[activeChat._id]?.hasMore && (
                  <div className="mobile-loading">
                    <button 
                      onClick={() => loadOlderMessages(activeChat._id)}
                      disabled={loadingOlderMessages}
                      className="mobile-load-more-btn"
                    >
                      {loadingOlderMessages ? 'Загрузка...' : 'Загрузить старые сообщения'}
                    </button>
                  </div>
                )}
                
                {chatMessages.map(message => {
                  if (message.type === 'call') return null;
                  
                  const isOwn = message.sender._id === user._id || message.sender.id === user.id;
                  const messageTime = formatMessageTime(message.createdAt);
                  
                  return (
                    <div 
                      key={message._id} 
                      className={`mobile-message ${isOwn ? 'own' : 'other'}`}
                    >
                      {!isOwn && (
                        <Avatar 
                          src={message.sender.avatar || null}
                          alt={message.sender.displayName || message.sender.username}
                          size="small"
                          className="mobile-message-avatar"
                        />
                      )}
                      <div className="mobile-message-content">
                        <div className="mobile-message-body">
                          {message.content}
                        </div>
                        <div className="mobile-message-time">
                          {messageTime}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <div className="mobile-input-area">
            <div className="mobile-input-container">
              <textarea
                ref={inputRef}
                className="mobile-input-field"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <button 
                className="mobile-send-btn"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MobileMessenger;
