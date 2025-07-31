import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    totalUnread, 
    setTotalUnread 
  } = useSocket(user);

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Функция для работы с куки (для темы)
  const setCookie = (name, value, days = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Функция для загрузки CSS файла
  const loadCSS = (filename) => {
    const existingLink = document.getElementById('homepage-theme-css');
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.id = 'homepage-theme-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `./${filename}`;
    document.head.appendChild(link);
  };

  // Инициализация темы из куки
  useEffect(() => {
    const savedTheme = getCookie('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      loadCSS('HomePage.css');
    } else {
      setIsDarkTheme(false);
      loadCSS('HomePage1.css');
    }
  }, []);

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    setCookie('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      loadCSS('HomePage.css');
    } else {
      loadCSS('HomePage1.css');
    }
  };

  const currentPage = location.pathname.split('/')[1] || 'home';
  const showRightSidebar = currentPage === 'home';

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className={`home-container ${showRightSidebar ? 'show-right-sidebar' : ''}`}>
      <Header 
        user={user}
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        onLogout={logout}
      />
      
      <Sidebar 
        currentPage={currentPage}
        totalUnread={totalUnread}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
      />
      
      <main className="main-content">
        <Outlet />
      </main>
      
      {showRightSidebar && <RightSidebar />}
    </div>
  );
};

export default Layout;