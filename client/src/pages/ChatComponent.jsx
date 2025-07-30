import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageCircle, ArrowLeft, X, Search, User } from 'lucide-react';

const ChatComponent = ({ user, socket }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChats();
    loadUnreadCount();
  }, []);

  // Socket события
  useEffect(() => {
    if (!socket) return;

    socket.on('newChat', (chat) => {
      setChats(prev => [chat, ...prev]);
    });

    socket.on('newMessage', ({ chatId, message }) => {
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { ...chat, lastMessage: message, lastActivity: new Date().toISOString(), unreadCount: chat.unreadCount + 1 }
          : chat
      ));

      if (activeChat && activeChat._id === chatId) {
        setMessages(prev => [...prev, message]);
        markAsRead(chatId);
      } else {
        setTotalUnread(prev => prev + 1);
      }
    });

    socket.on('messagesRead', ({ chatId }) => {
      if (activeChat && activeChat._id === chatId) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      }
    });

    return () => {
      socket.off('newChat');
      socket.off('newMessage');
      socket.off('messagesRead');
    };
  }, [socket, activeChat]);

  const loadChats = async () => {
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/messages/chats');
      setChats(res.data);
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/messages/unread-count');
      setTotalUnread(res.data.totalUnread);
    } catch (err) {
      console.error('Ошибка загрузки непрочитанных:', err);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/messages/chats/${chatId}/messages`);
      setMessages(res.data);
      markAsRead(chatId);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      await axios.put(`https://server-u9ji.onrender.com/api/messages/chats/${chatId}/read`);
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
      loadUnreadCount();
    } catch (err) {
      console.error('Ошибка отметки прочтения:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    try {
      await axios.post(`https://server-u9ji.onrender.com/api/messages/chats/${activeChat._id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
    }
  };

  const searchForUsers = async (query) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/users/search?query=${query}`);
      setSearchUsers(res.data.filter(u => u._id !== user.id && u._id !== user._id));
    } catch (err) {
      console.error('Ошибка поиска пользователей:', err);
    }
  };

  const createChat = async (participantId) => {
    try {
      const res = await axios.post('https://server-u9ji.onrender.com/api/messages/chats', {
        participantId
      });
      
      setChats(prev => {
        const exists = prev.find(chat => chat._id === res.data._id);
        if (exists) return prev;
        return [res.data, ...prev];
      });
      
      setActiveChat(res.data);
      setShowUserSearch(false);
      setSearchQuery('');
      setSearchUsers([]);
      loadMessages(res.data._id);
    } catch (err) {
      console.error('Ошибка создания чата:', err);
    }
  };

  const handleChatClick = (chat) => {
    setActiveChat(chat);
    loadMessages(chat._id);
  };

  // Рендер списка чатов
  if (!activeChat) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>
            <MessageCircle size={20} />
            Чаты {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}
          </h3>
          <button 
            onClick={() => setShowUserSearch(true)}
            className="new-chat-btn"
          >
            Новый чат
          </button>
        </div>

        {showUserSearch && (
          <div className="user-search-modal">
            <div className="search-header">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchForUsers(e.target.value);
                }}
                placeholder="Найти пользователя..."
                className="search-input"
                autoFocus
              />
              <button onClick={() => setShowUserSearch(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="search-results">
              {searchUsers.map(searchUser => (
                <div 
                  key={searchUser._id}
                  className="search-result"
                  onClick={() => createChat(searchUser._id)}
                >
                  <User size={16} />
                  <span>@{searchUser.username}</span>
                </div>
              ))}
              {searchQuery && searchUsers.length === 0 && (
                <div className="no-results">Пользователи не найдены</div>
              )}
            </div>
          </div>
        )}

        <div className="chats-list">
          {chats.length === 0 ? (
            <div className="no-chats">
              <MessageCircle size={48} />
              <p>У вас пока нет чатов</p>
              <button onClick={() => setShowUserSearch(true)}>
                Начать чат
              </button>
            </div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat._id}
                className="chat-item"
                onClick={() => handleChatClick(chat)}
              >
                <div className="chat-info">
                  <div className="chat-name">
                    {chat.name}
                    {chat.unreadCount > 0 && (
                      <span className="unread-count">{chat.unreadCount}</span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <div className="last-message">
                      {chat.lastMessage.content}
                    </div>
                  )}
                </div>
                <div className="chat-time">
                  {chat.lastActivity && new Date(chat.lastActivity).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Рендер активного чата
  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={() => setActiveChat(null)} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h3>{activeChat.name}</h3>
      </div>

      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message._id}
            className={`message ${message.sender._id === user.id || message.sender._id === user._id ? 'own' : 'other'}`}
          >
            <div className="message-content">
              {message.sender._id !== user.id && message.sender._id !== user._id && (
                <div className="message-sender">@{message.sender.username}</div>
              )}
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {new Date(message.createdAt).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написать сообщение..."
          className="message-input"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="send-btn" disabled={!newMessage.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;