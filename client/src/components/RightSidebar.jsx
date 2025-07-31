import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, TrendingUp } from 'lucide-react';
import axios from 'axios';

const RightSidebar = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    try {
      // Загружаем рекомендации пользователей
      const suggestionsRes = await axios.get('https://server-u9ji.onrender.com/api/users/suggestions');
      setSuggestions(suggestionsRes.data.slice(0, 3)); // Показываем 3 пользователей
      
      // Загружаем тренды (можно заменить на реальный API)
      setTrends([
        { name: '#SocialSpace', posts: 127 },
        { name: '#JavaScript', posts: 89 },
        { name: '#React', posts: 64 },
        { name: '#WebDev', posts: 43 },
        { name: '#Programming', posts: 38 }
      ]);
      
    } catch (err) {
      console.error('Ошибка загрузки данных для правой панели:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/follow/${userId}`);
      setSuggestions(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, followed: !user.followed }
          : user
      ));
    } catch (err) {
      console.error('Ошибка подписки/отписки:', err);
    }
  };

  const startChat = async (userId) => {
    try {
      const res = await axios.post('https://server-u9ji.onrender.com/api/messages/chats', {
        participantId: userId
      });
      navigate('/messages');
    } catch (err) {
      console.error('Ошибка создания чата:', err);
    }
  };

  if (loading) {
    return (
      <aside className="right-sidebar">
        <div className="sidebar-section">
          <div className="section-header">
            <h3>Загрузка...</h3>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="right-sidebar">
      {/* Рекомендуемые пользователи */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3><Users size={18} /> Рекомендуемые</h3>
          <button 
            onClick={() => navigate('/search')} 
            className="see-all-btn"
          >
            Показать всех
          </button>
        </div>
        <div className="suggestions-list">
          {suggestions.length > 0 ? (
            suggestions.map(user => (
              <div key={user._id} className="suggestion-item">
                <div className="suggestion-info">
                  <div 
                    className="suggestion-details clickable"
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    <span className="suggestion-username">@{user.username}</span>
                    <span className="suggestion-stats">
                      {user.followersCount || 0} подписчиков
                    </span>
                  </div>
                </div>
                <div className="suggestion-actions">
                  <button 
                    onClick={() => toggleFollow(user._id)}
                    className={`suggestion-follow-btn ${user.followed ? 'following' : ''}`}
                  >
                    {user.followed ? 'Отписаться' : 'Подписаться'}
                  </button>
                  <button 
                    onClick={() => startChat(user._id)}
                    className="suggestion-message-btn"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">
              Нет рекомендаций
            </div>
          )}
        </div>
      </div>

      {/* Тренды */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3><TrendingUp size={18} /> Тренды</h3>
        </div>
        <div className="trends-list">
          {trends.map((trend, index) => (
            <div key={index} className="trend-item">
              <div className="trend-info">
                <span className="trend-name">{trend.name}</span>
                <span className="trend-posts">{trend.posts} постов</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* О проекте */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>О SocialSpace</h3>
        </div>
        <div className="about-content">
          <p>Современная социальная сеть для общения и обмена идеями.</p>
          <p>Версия 1.0</p>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;