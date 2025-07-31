import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Users, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Загружаем рекомендации при загрузке компонента
  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/users/suggestions');
      setSuggestions(res.data.slice(0, 10)); // Показываем больше пользователей на странице поиска
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций:', err);
      setSuggestions([]);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setLoading(true);
      try {
        const res = await axios.get(`https://server-u9ji.onrender.com/api/users/search?query=${query}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Ошибка поиска пользователей:', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const toggleFollow = async (userId) => {
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/follow/${userId}`);
      
      // Обновляем состояние в suggestions
      setSuggestions(prev => prev.map(suggestion => 
        suggestion._id === userId 
          ? { ...suggestion, followed: !suggestion.followed }
          : suggestion
      ));
      
      // Обновляем состояние в search results
      setSearchResults(prev => prev.map(result => 
        result._id === userId 
          ? { ...result, followed: !result.followed }
          : result
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

  const UserCard = ({ user: searchUser, isSearchResult = false }) => (
    <div className="user-card">
      <div className="user-card-info">
        <div 
          className="user-card-details clickable"
          onClick={() => handleUserClick(searchUser._id)}
        >
          <span className="user-card-username">@{searchUser.username}</span>
          <span className="user-card-stats">
            {searchUser.followersCount || 0} подписчиков
          </span>
        </div>
        
        <div className="user-card-actions">
          <button 
            onClick={() => toggleFollow(searchUser._id)}
            className={`follow-btn ${searchUser.followed ? 'following' : ''}`}
          >
            <Users size={14} /> 
            {searchUser.followed ? 'Отписаться' : 'Подписаться'}
          </button>
          <button 
            onClick={() => startChat(searchUser._id)}
            className="message-btn"
          >
            <MessageCircle size={14} /> Написать
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="search-page">
      <div className="search-header">
        <h2>Поиск пользователей</h2>
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <SearchIcon size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Введите имя пользователя..."
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="search-content">
        {searchQuery.trim() ? (
          <div className="search-results">
            <h3>Результаты поиска</h3>
            {loading ? (
              <div className="search-loading">Поиск...</div>
            ) : searchResults.length > 0 ? (
              <div className="users-list">
                {searchResults.map(searchUser => (
                  <UserCard 
                    key={searchUser._id} 
                    user={searchUser} 
                    isSearchResult={true} 
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                Пользователи не найдены
              </div>
            )}
          </div>
        ) : (
          <div className="suggestions-section">
            <h3>Рекомендуемые пользователи</h3>
            {suggestions.length > 0 ? (
              <div className="users-list">
                {suggestions.map(suggestionUser => (
                  <UserCard key={suggestionUser._id} user={suggestionUser} />
                ))}
              </div>
            ) : (
              <div className="no-suggestions">
                Рекомендации загружаются...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;