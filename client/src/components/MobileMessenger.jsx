import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Send, MoreVertical } from 'lucide-react';
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
  totalUnread, 
  initiateCall, 
  getUserStatus, 
  user 
}) => {
  const [view, setView] = useState('chats'); // 'chats' или 'chat'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChat && view === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeChat, view]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    loadMessages(chat._id);
    setView('chat');
  };

  const handleBackToChats = () => {
    setView('chats');
    setActiveChat(null);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage();
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Рендер списка чатов
  const renderChatsList = () => (
    <div className="mobile-chats-view">
      <div className="mobile-chats-header">
        <h2>Сообщения</h2>
        {totalUnread > 0 && <span className="mobile-total-unread">{totalUnread}</span>}
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
                    <div className="mobile-chat-header-row">
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
                      {otherUser && (
                        <OnlineStatus
                          userId={otherUser._id}
                          isOnline={getUserStatus(otherUser._id).isOnline}
                          lastSeen={getUserStatus(otherUser._id).lastSeen}
                          showText={false}
                          size="small"
                        />
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
          <div className="mobile-no-chats">Чатов пока нет</div>
        )}
      </div>
    </div>
  );

  // Рендер активного чата
  const renderActiveChat = () => {
    if (!activeChat) return null;

    const otherUser = activeChat.participants && activeChat.participants.length === 2 
      ? activeChat.participants.find(p => p._id !== user._id && p._id !== user.id)
      : null;
    
    const userStatus = getUserStatus(otherUser?._id);

    return (
      <div className="mobile-chat-view">
        {/* Хедер чата */}
        <div className="mobile-chat-header">
          <button 
            className="mobile-back-btn"
            onClick={handleBackToChats}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="mobile-chat-user-info">
            <Avatar 
              src={otherUser?.avatar || null}
              alt={otherUser?.displayName || otherUser?.username || 'User'}
              size="medium"
              className="mobile-chat-header-avatar"
            />
            <div className="mobile-chat-title-section">
              <h3>{activeChat.name}</h3>
              <OnlineStatus
                userId={otherUser?._id}
                isOnline={userStatus.isOnline}
                lastSeen={userStatus.lastSeen}
                showText={true}
                size="small"
              />
            </div>
          </div>
          
          <div className="mobile-chat-actions">
            <button 
              onClick={() => initiateCall('audio')}
              className="mobile-call-button"
              title="Голосовой звонок"
            >
              <Phone size={18} />
            </button>
            <button className="mobile-more-button">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="mobile-messages-area">
          {messagesLoading ? (
            <div className="mobile-messages-loading">Загрузка сообщений...</div>
          ) : (
            <>
              {/* Кнопка загрузки старых сообщений */}
              {messages[activeChat._id]?.pagination?.hasMore && (
                <div className="mobile-load-more-messages">
                  <button 
                    onClick={() => loadOlderMessages(activeChat._id)}
                    disabled={loadingOlderMessages}
                    className="mobile-load-more-btn"
                  >
                    {loadingOlderMessages ? 'Загрузка...' : 'Загрузить еще'}
                  </button>
                </div>
              )}

              {/* Сообщения */}
              <div className="mobile-messages-list">
                {messages[activeChat._id]?.messages?.map((message) => (
                  <div 
                    key={message._id} 
                    className={`mobile-message ${message.sender._id === user._id ? 'own' : 'other'}`}
                  >
                    {message.sender._id !== user._id && (
                      <Avatar 
                        src={message.sender.avatar || null}
                        alt={message.sender.displayName || message.sender.username}
                        size="small"
                        className="mobile-message-avatar"
                      />
                    )}
                    <div className="mobile-message-body">
                      <div className="mobile-message-header">
                        <span className="mobile-message-sender">
                          {message.sender._id === user._id ? 'Вы' : message.sender.displayName || message.sender.username}
                        </span>
                        <span className="mobile-message-time">
                          {new Date(message.createdAt).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="mobile-message-content">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Область ввода сообщения */}
        <div className="mobile-message-input-area">
          <div className="mobile-message-input-wrapper">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Написать сообщение..."
              className="mobile-message-input"
              rows="1"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="mobile-send-message-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-messenger">
      {view === 'chats' ? renderChatsList() : renderActiveChat()}
    </div>
  );
};

export default MobileMessenger;
