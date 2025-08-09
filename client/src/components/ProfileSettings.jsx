import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, FileText } from 'lucide-react';
import axios from 'axios';
import './ProfileSettings.css';

const ProfileSettings = ({ isOpen, onClose, user, onProfileUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Обработка выбора файла аватарки
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // Максимум 5MB
        alert('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Показываем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Конвертация файла в base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Сохранение настроек профиля
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      let avatarData = avatar;
      
      // Если выбран новый файл аватарки, конвертируем в base64
      if (avatarFile) {
        avatarData = await fileToBase64(avatarFile);
      }
      
      const profileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatarData
      };
      
      // Отправляем на сервер
      const response = await axios.put(
        `https://server-pqqy.onrender.com/api/users/profile/${user._id || user.id}`, 
        profileData
      );
      
      // Обновляем локальные данные пользователя
      const updatedUser = {
        ...user,
        ...profileData
      };
      
      // Сохраняем в localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Вызываем callback для обновления профиля в родительском компоненте
      onProfileUpdate(updatedUser);
      
      // Закрываем модальное окно (переключение на профиль произойдет в handleProfileUpdate)
      
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      // Тихо обрабатываем ошибку без alert
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-settings-overlay">
      <div className="profile-settings-modal">
        <div className="profile-settings-header">
          <h2>Настройки профиля</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="profile-settings-content">
          {/* Аватарка */}
          <div className="setting-group">
            <label className="setting-label">
              <Camera size={20} />
              Аватарка
            </label>
            <div className="avatar-upload-section">
              <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <Camera size={40} />
                    <span>Загрузить фото</span>
                  </div>
                )}
                <div className="avatar-overlay">
                  <Camera size={24} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <div className="avatar-info">
                <p>Нажмите чтобы загрузить фото</p>
                <p className="avatar-hint">Рекомендуется: квадратное изображение, до 5MB</p>
              </div>
            </div>
          </div>

          {/* Отображаемое имя */}
          <div className="setting-group">
            <label className="setting-label" htmlFor="displayName">
              <User size={20} />
              Отображаемое имя
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Как вас зовут?"
              maxLength="50"
              className="setting-input"
            />
            <p className="setting-hint">
              Это имя будут видеть другие пользователи. Username: @{user?.username}
            </p>
          </div>

          {/* Описание профиля */}
          <div className="setting-group">
            <label className="setting-label" htmlFor="bio">
              <FileText size={20} />
              О себе
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
              maxLength="160"
              rows="3"
              className="setting-textarea"
            />
            <p className="setting-hint">
              {bio.length}/160 символов
            </p>
          </div>
        </div>
        
        <div className="profile-settings-footer">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>Сохранение...</>
            ) : (
              <>
                <Save size={18} />
                Сохранить
              </>
            )}
          </button>
          {/* Кнопка выхода убрана из настроек профиля по требованию */}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;