import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Подключение...');
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);

  // Подключение Socket.IO
  useEffect(() => {
    const initializeSocket = () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken || !user) return;

      console.log('Initializing Socket.IO connection...');
      setConnectionStatus('Подключение...');

      socketRef.current = io('https://server-u9ji.onrender.com', {
        auth: {
          token: accessToken
        },
        transports: ['websocket', 'polling']
      });

      // Обработчики подключения
      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
        setConnectionStatus('Подключено');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
        setConnectionStatus('Отключено');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
        setConnectionStatus('Ошибка подключения');
      });

      // Обработчик для счетчика непрочитанных сообщений
      socketRef.current.on('unreadCountUpdated', ({ chatId, unreadCount, totalUnreadDecrement }) => {
        console.log('Unread count updated:', { chatId, unreadCount, totalUnreadDecrement });
        setTotalUnread(prev => Math.max(0, prev - totalUnreadDecrement));
      });
    };

    if (user) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting Socket.IO...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Функция для получения текущего сокета
  const getSocket = () => socketRef.current;

  // Функция для эмита событий
  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  // Функция для подписки на события
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Функция для отписки от событий
  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    totalUnread,
    setTotalUnread,
    getSocket,
    emit,
    on,
    off
  };
};