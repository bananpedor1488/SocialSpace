import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useOnlineStatus = (socket) => {
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  // Обновление статуса пользователя
  const updateUserStatus = useCallback((userId, status) => {
    setOnlineUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...status,
        lastSeen: status.lastSeen ? new Date(status.lastSeen) : null
      });
      return newMap;
    });
  }, []);

  // Получение онлайн статуса пользователей через API
  const fetchOnlineStatus = useCallback(async (userIds, retryCount = 0) => {
    if (!userIds || userIds.length === 0) return {};
    
    try {
      const token = localStorage.getItem('accessToken');
      const baseURL = window.location.hostname === 'localhost' ? 
        'http://localhost:3000' : 
        'https://server-1-ewdd.onrender.com';
      
      console.log(`Fetching online status for users: ${userIds.join(',')}`);
      
      const response = await axios.get(`${baseURL}/api/users/online-status`, {
        params: { userIds: userIds.join(',') },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const statusMap = response.data;
        console.log('Online status received:', statusMap);
        
        // Обновляем локальное состояние
        Object.entries(statusMap).forEach(([userId, status]) => {
          updateUserStatus(userId, status);
        });
        
        return statusMap;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
      
      // Retry механизм (максимум 2 попытки)
      if (retryCount < 2) {
        console.log(`Retrying online status fetch, attempt ${retryCount + 1}`);
        setTimeout(() => {
          fetchOnlineStatus(userIds, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Экспоненциальная задержка
      }
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
      console.log('User came online:', userId, username);
      updateUserStatus(userId, {
        username,
        isOnline: true,
        lastSeen: timestamp
      });
    };

    const handleUserOffline = ({ userId, username, lastSeen }) => {
      console.log('User went offline:', userId, username);
      updateUserStatus(userId, {
        username,
        isOnline: false,
        lastSeen
      });
    };

    // Синхронизация всех онлайн пользователей при подключении
    const handleOnlineUsersSync = ({ users }) => {
      console.log('Syncing online users:', users);
      Object.entries(users).forEach(([userId, status]) => {
        updateUserStatus(userId, status);
      });
    };

    // Подписываемся на события
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineUsersSync', handleOnlineUsersSync);

    // Настраиваем heartbeat каждые 30 секунд
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('onlineUsersSync', handleOnlineUsersSync);
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