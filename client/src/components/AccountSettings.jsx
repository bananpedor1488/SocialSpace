import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, Key, Bell, Palette, LogOut, Sun, Moon, 
  Mail, CheckCircle, AlertCircle, Clock, Monitor, Smartphone,
  Globe, MapPin, Calendar, Eye, EyeOff, Trash2, RefreshCw,
  Smartphone as MobileIcon, Monitor as DesktopIcon, Tablet
} from 'lucide-react';
import axios from 'axios';
import './AccountSettings.css';

const AccountSettings = ({ isOpen, onClose, user, onLogout, isDarkTheme, onToggleTheme }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (isOpen && user) {
      fetchSessions();
    }
  }, [isOpen, user]);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await axios.get('https://server-pqqy.onrender.com/api/auth/sessions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Ошибка при получении сессий:', error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await axios.post('https://server-pqqy.onrender.com/api/auth/logout');
      onLogout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setMessage('Ошибка при выходе из аккаунта');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await axios.delete(`https://server-pqqy.onrender.com/api/auth/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setSessions(sessions.filter(session => session.sessionId !== sessionId));
      showMessage('Сессия успешно завершена', 'success');
    } catch (error) {
      console.error('Ошибка при завершении сессии:', error);
      showMessage('Ошибка при завершении сессии', 'error');
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await axios.delete('https://server-pqqy.onrender.com/api/auth/sessions/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setSessions(sessions.filter(session => session.isCurrent));
      showMessage('Все сессии успешно завершены', 'success');
    } catch (error) {
      console.error('Ошибка при завершении всех сессий:', error);
      showMessage('Ошибка при завершении всех сессий', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return <MobileIcon size={16} />;
      case 'tablet': return <Tablet size={16} />;
      case 'desktop': 
      default: return <DesktopIcon size={16} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) return 'Только что';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} мин назад`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} ч назад`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} дн назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="account-settings-overlay" onClick={onClose}>
      <div className="account-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-settings-header">
          <div className="header-content">
            <h2><User size={24} /> Настройки аккаунта</h2>
            <p>Управление профилем и безопасностью</p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="account-settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Профиль
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            Безопасность
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Monitor size={18} />
            Сессии
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={18} />
            Внешний вид
          </button>
        </div>

        <div className="account-settings-content">
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Вкладка Профиль */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="info-card">
                <div className="card-header">
                  <User size={20} />
                  <h3>Информация профиля</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Имя пользователя</span>
                    <span className="info-value">@{user?.username}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <div className="info-value-with-status">
                      <span>{user?.email || 'Не указан'}</span>
                      {user?.emailVerified ? (
                        <span className="status-badge verified">
                          <CheckCircle size={14} />
                          Подтвержден
                        </span>
                      ) : (
                        <span className="status-badge unverified">
                          <AlertCircle size={14} />
                          Не подтвержден
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Дата регистрации</span>
                    <span className="info-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Неизвестно'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Последний вход</span>
                    <span className="info-value">
                      {user?.lastLogin ? formatDate(user.lastLogin) : 'Неизвестно'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка Безопасность */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <div className="info-card">
                <div className="card-header">
                  <Shield size={20} />
                  <h3>Безопасность аккаунта</h3>
                </div>
                <div className="security-items">
                  <div className="security-item">
                    <div className="security-icon">
                      <Mail size={20} />
                    </div>
                    <div className="security-content">
                      <h4>Подтверждение email</h4>
                      <p>Статус: {user?.emailVerified ? 'Подтвержден' : 'Не подтвержден'}</p>
                      {!user?.emailVerified && (
                        <button className="action-btn secondary">
                          Отправить код подтверждения
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="security-item">
                    <div className="security-icon">
                      <Key size={20} />
                    </div>
                    <div className="security-content">
                      <h4>Двухфакторная аутентификация</h4>
                      <p>Дополнительная защита аккаунта</p>
                      <button className="action-btn secondary">
                        Настроить 2FA
                      </button>
                    </div>
                  </div>
                  <div className="security-item">
                    <div className="security-icon">
                      <Clock size={20} />
                    </div>
                    <div className="security-content">
                      <h4>Последний вход</h4>
                      <p>{user?.lastLogin ? formatDate(user.lastLogin) : 'Неизвестно'}</p>
                      <span className="last-login-details">
                        <Globe size={14} />
                        {user?.lastLoginIP || 'IP не определен'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка Сессии */}
          {activeTab === 'sessions' && (
            <div className="tab-content">
              <div className="sessions-header">
                <h3>Активные сессии</h3>
                <button 
                  className="action-btn danger"
                  onClick={handleTerminateAllSessions}
                  disabled={sessionsLoading}
                >
                  <Trash2 size={16} />
                  Завершить все сессии
                </button>
              </div>
              
              {sessionsLoading ? (
                <div className="loading-sessions">
                  <RefreshCw size={20} className="spinning" />
                  Загрузка сессий...
                </div>
              ) : (
                <div className="sessions-list">
                  {sessions.length === 0 ? (
                    <div className="no-sessions">
                      <p>Сессии не найдены</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.sessionId} className={`session-item ${session.isCurrent ? 'current' : ''}`}>
                        <div className="session-icon">
                          {getDeviceIcon(session.deviceType)}
                        </div>
                        <div className="session-info">
                          <div className="session-header">
                            <h4>{session.device}</h4>
                            {session.isCurrent && <span className="current-badge">Текущая</span>}
                          </div>
                          <div className="session-details">
                            <span className="session-location">
                              <MapPin size={14} />
                              {session.location || 'Неизвестно'}
                            </span>
                            <span className="session-ip">
                              <Globe size={14} />
                              {session.ip}
                            </span>
                            <span className="session-time">
                              <Clock size={14} />
                              {formatDate(session.lastActivity)}
                            </span>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button 
                            className="terminate-btn"
                            onClick={() => handleTerminateSession(session.sessionId)}
                            title="Завершить сессию"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Вкладка Внешний вид */}
          {activeTab === 'appearance' && (
            <div className="tab-content">
              <div className="info-card">
                <div className="card-header">
                  <Palette size={20} />
                  <h3>Настройки внешнего вида</h3>
                </div>
                <div className="appearance-items">
                  <div className="appearance-item">
                    <div className="appearance-content">
                      <h4>Тема оформления</h4>
                      <p>Выберите предпочитаемую тему</p>
                    </div>
                    <button 
                      className="theme-toggle-btn"
                      onClick={onToggleTheme}
                    >
                      <div className="theme-icon">
                        {isDarkTheme ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <span>{isDarkTheme ? 'Темная' : 'Светлая'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="account-settings-footer">
          <div className="danger-zone">
            <h4>Опасная зона</h4>
            <button 
              className="logout-btn"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut size={18} />
              {isLoading ? 'Выход...' : 'Выйти из аккаунта'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
