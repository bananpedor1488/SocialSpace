import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, LogOut, Moon, Sun } from 'lucide-react';
import axios from 'axios';

const Header = ({ user, isDarkTheme, toggleTheme, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const res = await axios.get(`https://server-u9ji.onrender.com/api/users/search?query=${query}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Ошибка поиска пользователей:', err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchClick = (searchUser) => {
    navigate(`/profile/${searchUser._id}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>
            <Flame size={24} /> SocialSpace
          </h1>
        </div>
        
        <div className="header-search">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Поиск пользователей..."
            className="header-search-input"
          />
          {searchResults.length > 0 && (
            <div className="header-search-results">
              {searchResults.map(searchUser => (
                <div 
                  key={searchUser._id} 
                  className="header-search-result" 
                  onClick={() => handleSearchClick(searchUser)}
                >
                  <span className="header-search-username">@{searchUser.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <span>Hello, {user?.username}!</span>
          
          <button onClick={toggleTheme} className="theme-toggle">
            <div className="theme-icon">
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className="theme-text">
              {isDarkTheme ? 'Светлая' : 'Темная'}
            </span>
          </button>
          
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;