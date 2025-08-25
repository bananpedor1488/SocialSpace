# Улучшения настроек аккаунта

## Описание проблем
1. **Z-index вкладки "Настройки аккаунта"** - вкладка уходила под поисковую строку браузера
2. **Менеджер сессий** - показывал моковые данные вместо реальных сессий
3. **Последний вход** - не отображался корректно

## Исправления

### 1. **Исправлен Z-index вкладки "Настройки аккаунта"**

#### Проблема
Вкладка "Настройки аккаунта" в боковой панели уходила под поисковую строку браузера из-за низкого z-index.

#### Решение
Добавлен высокий z-index для боковой панели в `HomePage.css`:

```css
/* Боковая панель */
.sidebar {
  /* ... */
  z-index: 1000;
}
```

### 2. **Реализован реальный менеджер сессий**

#### Бэкенд (SERVER/routes/auth.js)

##### A. Улучшена логика создания сессий при входе
```javascript
// Создаем новую сессию
const sessionId = require('crypto').randomBytes(32).toString('hex');
const userAgent = req.headers['user-agent'] || 'Unknown';
const clientIP = getClientIP(req);

// Сбрасываем флаг isCurrent для всех существующих сессий
user.sessions.forEach(session => {
  session.isCurrent = false;
});

// Создаем новую сессию
const newSession = {
  sessionId,
  device: `${getBrowser(userAgent)} на ${getOS(userAgent)}`,
  deviceType: getDeviceType(userAgent),
  browser: getBrowser(userAgent),
  os: getOS(userAgent),
  ip: clientIP,
  location: 'Определяется...',
  userAgent,
  lastActivity: new Date(),
  isCurrent: true,
  createdAt: new Date()
};

// Добавляем новую сессию
user.sessions.push(newSession);

// Обновляем информацию о последнем входе
user.lastLogin = new Date();
user.lastLoginIP = clientIP;
user.lastLoginUserAgent = userAgent;
```

##### B. API для управления сессиями
- `GET /api/auth/sessions` - получить все сессии пользователя
- `DELETE /api/auth/sessions/:sessionId` - завершить конкретную сессию
- `DELETE /api/auth/sessions/all` - завершить все сессии кроме текущей
- `PUT /api/auth/sessions/activity` - обновить активность сессии

##### C. Автоматическая очистка старых сессий
```javascript
// Очищаем старые сессии (старше 30 дней)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
user.sessions = user.sessions.filter(session => 
  session.lastActivity > thirtyDaysAgo
);
```

#### Фронтенд (AccountSettings.jsx)

##### A. Убраны моковые данные
```javascript
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
```

##### B. Обновлено отображение сессий
```javascript
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
```

### 3. **Улучшено отображение последнего входа**

#### В профиле пользователя
```javascript
<div className="info-item">
  <span className="info-label">Последний вход</span>
  <span className="info-value">
    {user?.lastLogin ? formatDate(user.lastLogin) : 'Неизвестно'}
  </span>
</div>
```

#### В ответе сервера при входе
```javascript
res.json({ 
  message: 'Вход выполнен успешно',
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  user: {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    lastLoginIP: user.lastLoginIP
  }
});
```

### 4. **Добавлены стили для пустого состояния**

```css
.no-sessions {
  text-align: center;
  padding: 40px 20px;
  color: var(--hint-color);
}

.no-sessions p {
  margin: 0;
  font-size: 16px;
}
```

## Технические детали

### Структура сессии
```javascript
{
  sessionId: "unique_session_id",
  device: "Chrome на Windows",
  deviceType: "desktop", // desktop, mobile, tablet
  browser: "Chrome",
  os: "Windows",
  ip: "192.168.1.1",
  location: "Москва, Россия",
  userAgent: "Mozilla/5.0...",
  lastActivity: "2024-01-01T12:00:00.000Z",
  isCurrent: true,
  createdAt: "2024-01-01T12:00:00.000Z"
}
```

### Функции определения устройства
- `getDeviceType(userAgent)` - определяет тип устройства
- `getBrowser(userAgent)` - определяет браузер
- `getOS(userAgent)` - определяет операционную систему
- `getClientIP(req)` - получает IP адрес клиента

### Безопасность
- Сессии автоматически очищаются через 30 дней
- Текущая сессия помечается флагом `isCurrent`
- При новом входе все предыдущие сессии помечаются как неактивные
- Каждая сессия имеет уникальный `sessionId`

## Результат

✅ **Z-index исправлен** - вкладка больше не уходит под поисковую строку
✅ **Реальный менеджер сессий** - показывает настоящие сессии пользователя
✅ **Корректный последний вход** - отображается реальное время последнего входа
✅ **Автоматическая очистка** - старые сессии удаляются автоматически
✅ **Безопасность** - правильное управление сессиями с уникальными ID
