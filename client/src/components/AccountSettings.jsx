import React, { useState } from 'react';
import { X, User, Shield, Key, Bell, Palette, LogOut, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import './ProfileSettings.css';

const AccountSettings = ({ isOpen, onClose, user, onLogout, isDarkTheme, onToggleTheme }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><User size={20} /> Настройки аккаунта</h3>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="profile-settings-content">
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <div className="settings-section">
            <h4><User size={18} /> Профиль</h4>
            <div className="setting-item">
              <span className="setting-label">Имя пользователя:</span>
              <span className="setting-value">@{user?.username}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Email:</span>
              <span className="setting-value">{user?.email || 'Не указан'}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Дата регистрации:</span>
              <span className="setting-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
              </span>
            </div>
          </div>

          <div className="settings-section">
            <h4><Shield size={18} /> Безопасность</h4>
            <div className="setting-item">
              <span className="setting-label">Двухфакторная аутентификация:</span>
              <span className="setting-value">Не настроена</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Последний вход:</span>
              <span className="setting-value">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : 'Неизвестно'}
              </span>
            </div>
          </div>

          <div className="settings-section">
            <h4><Bell size={18} /> Уведомления</h4>
            <div className="setting-item">
              <span className="setting-label">Email уведомления:</span>
              <span className="setting-value">Включены</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Push уведомления:</span>
              <span className="setting-value">Включены</span>
            </div>
          </div>

          <div className="settings-section">
            <h4><Palette size={18} /> Внешний вид</h4>
            <div className="setting-item">
              <span className="setting-label">Тема:</span>
              <button 
                className="theme-toggle-btn"
                onClick={onToggleTheme}
              >
                <div className="theme-icon">
                  {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <span className="theme-text">
                  {isDarkTheme ? 'Светлая' : 'Темная'}
                </span>
              </button>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h4><LogOut size={18} /> Опасная зона</h4>
            <div className="setting-item">
              <span className="setting-label">Выход из аккаунта:</span>
              <button 
                className="logout-btn danger"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? 'Выход...' : 'Выйти из аккаунта'}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-settings-footer">
          <button className="cancel-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
