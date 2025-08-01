import { useState, useEffect, useCallback } from 'react';

const useOnlineStatus = (socket) => {
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  // Обновление статуса пользователя
  const updateUserStatus = useCallback((userId, status) => {
    setOnlineUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, status);
      return newMap;
    });
  }, []);

  // Получение онлайн статуса пользователей через API
  const fetchOnlineStatus = useCallback(async (userIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/online-status?userIds=${userIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statusMap = await response.json();
        
        // Обновляем локальное состояние
        Object.entries(statusMap).forEach(([userId, status]) => {
          updateUserStatus(userId, status);
        });
        
        return statusMap;
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
    }
    return {};
  }, [updateUserStatus]);

  // Отправка heartbeat для обновления активности
  const sendHeartbeat = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('user-activity');
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Обработчики Socket.IO событий
    const handleUserOnline = ({ userId, username, timestamp }) => {
      updateUserStatus(userId, {
        username,
        isOnline: true,
        lastSeen: timestamp
      });
    };

    const handleUserOffline = ({ userId, username, lastSeen }) => {
      updateUserStatus(userId, {
        username,
        isOnline: false,
        lastSeen
      });
    };

    // Подписываемся на события
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    // Настраиваем heartbeat каждые 30 секунд
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      clearInterval(heartbeatInterval);
    };
  }, [socket, updateUserStatus, sendHeartbeat]);

  // Получение статуса конкретного пользователя
  const getUserStatus = useCallback((userId) => {
    return onlineUsers.get(userId) || { isOnline: false, lastSeen: null };
  }, [onlineUsers]);

  return {
    onlineUsers,
    updateUserStatus,
    fetchOnlineStatus,
    getUserStatus,
    sendHeartbeat
  };
};

export default useOnlineStatus;