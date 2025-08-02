import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import {
  Home, MessageCircle, User, LogOut, Plus,
  Heart, MessageSquare, Repeat, Pencil, Trash2, Users, UserCheck, Send, X, ChevronDown,
  Moon, Sun, Wifi, WifiOff, Flame, Clock, Phone, Video, Settings
} from 'lucide-react';

import CallInterface from '../components/CallInterface';
import OnlineStatus from '../components/OnlineStatus';
import ProfileSettings from '../components/ProfileSettings';
import Avatar from '../components/Avatar';

import useOnlineStatus from '../hooks/useOnlineStatus';

const HomePage = () => {
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [postText, setPostText] = useState('');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Подключение...');
  const [typingUsers, setTypingUsers] = useState({});
  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ЧАТОВ
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  // СОСТОЯНИЯ ДЛЯ ЗВОНКОВ
  const [currentCall, setCurrentCall] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [userStatuses, setUserStatuses] = useState({}); // Онлайн статусы пользователей

  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  // Хук для онлайн статуса
  const { onlineUsers, fetchOnlineStatus, getUserStatus } = useOnlineStatus(socketRef.current);

  // Список изменений версий
  const changelogData = [
    {
      version: '1.6',
      date: '1 августа 2025',
      changes: [
        '📞 Голосовые звонки через WebRTC',
        '📹 Видео звонки с поддержкой камеры',
        '🎯 Красивые кнопки звонков в чатах',
        '⚡ Управление микрофоном и камерой',
        '🔔 Уведомления о входящих звонках',
        '✨ Анимации и современный дизайн интерфейса'
      ]
    },
    {
      version: '1.5',
      date: '30 июля 2025',
      changes: [
        '💬 Добавлены приватные чаты между пользователями',
        '🔔 Уведомления о новых сообщениях в реальном времени',
        '📱 Счетчик непрочитанных сообщений',
        '✨ Отметка о прочтении сообщений',
        '🎯 Улучшена навигация между разделами'
      ]
    },
    {
      version: '1.4',
      date: '24 июля 2025',
      changes: [
        '✨ Добавлена функция репостов с отображением оригинального автора',
        '🔄 Переработана система уведомлений в реальном времени',
        '🎨 Улучшен дизайн комментариев и постов',
        '🐛 Исправлены ошибки с отображением счетчиков лайков',
        '⚡ Оптимизирована загрузка постов'
      ]
    },
    {
      version: '1.3',
      date: '20 июля 2025',
      changes: [
        '💬 Добавлена система комментариев в реальном времени',
        '🔍 Улучшен поиск пользователей',
        '👥 Система подписок и рекомендаций',
        '🌙 Переключатель темной/светлой темы',
        '🐛 Исправлены проблемы с синхронизацией данных'
      ]
    },
    {
      version: '1.2',
      date: '15 июля 2025',
      changes: [
        '❤️ Система лайков с анимацией',
        '📱 Адаптивный дизайн для мобильных устройств',
        '⚡ Socket.IO интеграция для real-time обновлений',
        '🔐 JWT аутентификация вместо сессий',
        '🎯 Улучшена производительность приложения'
      ]
    },
    {
      version: '1.1',
      date: '10 июля 2025',
      changes: [
        '👤 Система профилей пользователей',
        '📝 Создание и просмотр постов',
        '🔒 Базовая система авторизации',
        '💾 Интеграция с MongoDB',
        '🎨 Первая версия UI/UX'
      ]
    },
    {
      version: '1.0',
      date: '5 июля 2025',
      changes: [
        '🚀 Первый релиз SocialSpace',
        '📋 Базовая регистрация и вход',
        '🏠 Главная страница с навигацией',
        '⚙️ Настройка сервера и базы данных',
        '🔧 Базовая архитектура приложения'
      ]
    }
  ];

  // JWT утилиты
  const getTokens = () => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  };

  const setTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const isAuthenticated = () => {
    const { accessToken } = getTokens();
    return !!accessToken;
  };

  // Функция для декодирования JWT токена (проверка на истечение)
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Функция обновления токена
  const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    
    if (!refreshToken || isTokenExpired(refreshToken)) {
      throw new Error('Refresh token expired');
    }

    try {
      const response = await axios.post('https://server-u9ji.onrender.com/api/auth/refresh', {
        refreshToken: refreshToken
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      setTokens(accessToken, newRefreshToken || refreshToken);
      
      return accessToken;
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  // Socket.IO подключение и обработчики
  useEffect(() => {
    const initializeSocket = () => {
      const { accessToken } = getTokens();
      
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

      socketRef.current.on('unreadCountUpdated', ({ chatId, unreadCount, totalUnreadDecrement }) => {
        console.log('Unread count updated:', { chatId, unreadCount, totalUnreadDecrement });
        setChats(prev => prev.map(chat =>
          chat._id === chatId ? { ...chat, unreadCount } : chat
        ));
        setTotalUnread(prev => Math.max(0, prev - totalUnreadDecrement));
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

      socketRef.current.on('userTyping', ({ chatId, userId, username, isTyping }) => {
        console.log('Typing status received:', { chatId, userId, username, isTyping });
        setTypingUsers(prev => ({
          ...prev,
          [chatId]: isTyping ? { userId, username } : null
        }));
      });

      // Real-time обработчики событий
      
      // Новый пост
      socketRef.current.on('newPost', (newPost) => {
        console.log('New post received:', newPost);
        const formattedPost = {
          _id: newPost._id,
          userId: newPost.author?._id || newPost.author,
          username: newPost.author?.username || 'Unknown',
          content: newPost.content,
          likes: newPost.likes?.length || 0,
          liked: newPost.likes?.includes(user._id || user.id) || false,
          date: new Date(newPost.createdAt || Date.now()).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          comments: newPost.comments || [],
          commentsCount: newPost.commentsCount || 0,
          isRepost: newPost.isRepost || false,
          originalPost: newPost.originalPost || null,
          repostedBy: newPost.repostedBy || null
        };

        setPosts(prev => [formattedPost, ...prev]);
      });

      // Новый репост
      socketRef.current.on('newRepost', (repostData) => {
        console.log('New repost received:', repostData);
        const formattedRepost = {
          _id: repostData._id,
          userId: repostData.repostedBy?._id || repostData.repostedBy,
          username: repostData.repostedBy?.username || 'Unknown',
          content: repostData.originalPost?.content || '',
          likes: repostData.originalPost?.likes?.length || 0,
          liked: repostData.originalPost?.likes?.includes(user._id || user.id) || false,
          date: new Date(repostData.createdAt || Date.now()).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          comments: repostData.originalPost?.comments || [],
          commentsCount: repostData.originalPost?.commentsCount || 0,
          isRepost: true,
          originalPost: {
            _id: repostData.originalPost?._id,
            author: repostData.originalPost?.author,
            content: repostData.originalPost?.content,
            createdAt: repostData.originalPost?.createdAt
          },
          repostedBy: repostData.repostedBy
        };

        setPosts(prev => [formattedRepost, ...prev]);
      });

      // Новый комментарий
      socketRef.current.on('newComment', ({ postId, comment }) => {
        console.log('New comment received:', { postId, comment });
        
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));

        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        ));

        setProfilePosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        ));
      });

      // Обновление лайка
      socketRef.current.on('likeUpdate', ({ postId, liked, likesCount, userId: likerUserId }) => {
        console.log('Like update received:', { postId, liked, likesCount, likerUserId });
        
        const isMyLike = likerUserId === (user._id || user.id);
        
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: likesCount,
                liked: isMyLike ? liked : post.liked
              } 
            : post
        ));

        setProfilePosts(prev => prev.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: likesCount,
                liked: isMyLike ? liked : post.liked
              } 
            : post
        ));
      });

      // Удаление поста
      socketRef.current.on('postDeleted', ({ postId }) => {
        console.log('Post deleted:', postId);
        setPosts(prev => prev.filter(post => post._id !== postId));
        setProfilePosts(prev => prev.filter(post => post._id !== postId));
        
        setComments(prev => {
          const newComments = { ...prev };
          delete newComments[postId];
          return newComments;
        });
      });

      // Удаление комментария
      socketRef.current.on('commentDeleted', ({ postId, commentId }) => {
        console.log('Comment deleted:', { postId, commentId });
        
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(comment => comment._id !== commentId)
        }));

        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - 1) }
            : post
        ));

        setProfilePosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - 1) }
            : post
        ));
      });

      // Обновление подписок
      socketRef.current.on('followUpdate', ({ targetUserId, followerId, followerUsername, isFollowing, followersCount }) => {
        console.log('Follow update received:', { targetUserId, followerId, followerUsername, isFollowing, followersCount });
        
        if (profile && profile._id === targetUserId) {
          setFollowers(followersCount);
          setProfile(prev => ({
            ...prev,
            followed: followerId === (user._id || user.id) ? isFollowing : prev.followed
          }));
        }

        setSuggestions(prev => prev.map(suggestion => 
          suggestion._id === targetUserId 
            ? { ...suggestion, followersCount }
            : suggestion
        ));
      });

      socketRef.current.on('followingUpdate', ({ userId, followingCount }) => {
        console.log('Following update received:', { userId, followingCount });
        
        if (profile && profile._id === userId && isOwnProfile()) {
          setFollowing(followingCount);
        }
      });

      // ИСПРАВЛЕННЫЕ SOCKET ОБРАБОТЧИКИ ДЛЯ ЧАТОВ
      socketRef.current.on('newChat', (newChat) => {
        console.log('New chat received:', newChat);
        setChats(prev => {
          const existingChat = prev.find(chat => chat._id === newChat._id);
          if (existingChat) {
            return prev.map(chat => chat._id === newChat._id ? newChat : chat);
          }
          return [newChat, ...prev];
        });
      });

      // ИСПРАВЛЕН обработчик newMessage
      socketRef.current.on('newMessage', ({ chatId, message }) => {
        console.log('New message received:', { chatId, message });
        
        // Обновляем сообщения в реальном времени
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), message]
        }));

        // Обновляем чаты
        setChats(prev => prev.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: message,
              unreadCount: activeChat?._id === chatId ? 0 : chat.unreadCount + 1
            };
          }
          return chat;
        }));

        // Обновляем общий счетчик непрочитанных только если это не активный чат
        if (activeChat?._id !== chatId) {
          setTotalUnread(prev => prev + 1);
        }
      });

      socketRef.current.on('messagesRead', ({ chatId, readBy }) => {
        console.log('Messages read:', { chatId, readBy });
        
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(msg => 
            msg.sender._id !== user._id && !msg.isRead
              ? { ...msg, isRead: true }
              : msg
          )
        }));
      });

      socketRef.current.on('messageDeleted', ({ chatId, messageId }) => {
        console.log('Message deleted:', { chatId, messageId });
        
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter(msg => msg._id !== messageId)
        }));
      });

      // ОБРАБОТЧИКИ СОБЫТИЙ ЗВОНКОВ
      socketRef.current.on('incomingCall', (callData) => {
        console.log('Incoming call received:', callData);
        
        // Создаем правильный объект с callId
        const formattedCall = {
          _id: callData.callId,
          callId: callData.callId,
          caller: callData.caller,
          callee: callData.callee,
          type: callData.type,
          status: 'pending'
        };
        
        console.log('Formatted incoming call data:', formattedCall);
        setCurrentCall(formattedCall);
        setIsIncomingCall(true);
      });

      socketRef.current.on('callInitiated', (callData) => {
        console.log('Call initiated:', callData);
        
        // Создаем правильный объект с callId
        const formattedCall = {
          _id: callData.callId,
          callId: callData.callId,
          caller: callData.caller,
          callee: callData.callee,
          type: callData.type,
          status: 'pending'
        };
        
        console.log('Formatted call data:', formattedCall);
        setCurrentCall(formattedCall);
        setIsIncomingCall(false);
      });

      socketRef.current.on('callAccepted', ({ callId }) => {
        console.log('Call accepted event received:', callId);
        console.log('Current call ID:', currentCall?._id || currentCall?.callId);
        
        if (currentCall?._id === callId || currentCall?.callId === callId) {
          console.log('Updating call status to accepted');
          setCurrentCall(prev => ({ ...prev, status: 'accepted' }));
        } else {
          console.warn('Call accepted event ID does not match current call');
        }
      });

      socketRef.current.on('callDeclined', ({ callId }) => {
        console.log('Call declined:', callId);
        if (currentCall?._id === callId || currentCall?.callId === callId) {
          setCurrentCall(null);
          setIsIncomingCall(false);
        }
      });

      socketRef.current.on('callEnded', ({ callId }) => {
        console.log('Call ended:', callId);
        if (currentCall?._id === callId || currentCall?.callId === callId) {
          setCurrentCall(null);
          setIsIncomingCall(false);
          
          // Дополнительная очистка медиа устройств
          navigator.mediaDevices.getUserMedia({ audio: false, video: false }).catch(() => {
            console.log('Media cleanup attempt');
          });
        }
      });

      // ОНЛАЙН СТАТУСЫ ПОЛЬЗОВАТЕЛЕЙ
      socketRef.current.on('user-status-update', ({ userId, username, isOnline, status, lastSeen }) => {
        setUserStatuses(prev => ({
          ...prev,
          [userId]: { username, isOnline, status, lastSeen: new Date(lastSeen) }
        }));
        console.log(`👤 ${username} is now ${status}`);
      });
    };

    if (user) {
      initializeSocket();
      // Очищаем зависшие звонки при загрузке страницы (тихо)
      emergencyCleanup(true);
    }

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting Socket.IO...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, profile, activeChat]);

  // Настройка axios interceptors для JWT
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          let { accessToken } = getTokens();
          
          if (accessToken && isTokenExpired(accessToken)) {
            try {
              accessToken = await refreshAccessToken();
              
              if (socketRef.current && user) {
                socketRef.current.disconnect();
                setTimeout(() => {
                  if (user) {
                    const newSocket = io('https://server-u9ji.onrender.com', {
                      auth: { token: accessToken },
                      transports: ['websocket', 'polling']
                    });
                    socketRef.current = newSocket;
                  }
                }, 100);
              }
            } catch (error) {
              clearTokens();
              if (socketRef.current) {
                socketRef.current.disconnect();
              }
              navigate('/');
              return Promise.reject(error);
            }
          }
          
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        
        delete config.withCredentials;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            clearTokens();
            if (socketRef.current) {
              socketRef.current.disconnect();
            }
            navigate('/');
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate, user]);

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
      document.body.className = 'dark-theme';
    } else {
      setIsDarkTheme(false);
      loadCSS('HomePage1.css');
      document.body.className = 'light-theme';
    }
  }, []);

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    setCookie('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      loadCSS('HomePage.css');
      document.body.className = 'dark-theme';
    } else {
      loadCSS('HomePage1.css');
      document.body.className = 'light-theme';
    }
  };

  // Проверяем, является ли профиль собственным
  const isOwnProfile = () => {
    if (!user || !profile) return false;
    return profile._id === user._id || profile._id === user.id;
  };

  // Получаем текущего пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        navigate('/');
        return;
      }

      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          

        }

        const res = await axios.get('https://server-u9ji.onrender.com/api/me');
        console.log('Current user data:', res.data.user);
        console.log('User avatar from server:', res.data.user.avatar);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Очищаем любые "зависшие" звонки при загрузке
        try {
          await axios.get('https://server-u9ji.onrender.com/api/calls/active');
        } catch (err) {
          // Если есть активный звонок, пытаемся его завершить
          if (err.response?.status === 409) {
            console.log('Found stuck call, cleaning up...');
            try {
              const activeCallRes = await axios.get('https://server-u9ji.onrender.com/api/calls/active');
              if (activeCallRes.data) {
                await axios.post(`https://server-u9ji.onrender.com/api/calls/end/${activeCallRes.data._id}`);
                console.log('Stuck call cleaned up');
              }
            } catch (cleanupErr) {
              console.log('Could not cleanup stuck call:', cleanupErr);
            }
          }
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        clearTokens();
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Получаем посты при загрузке пользователя
  useEffect(() => {
    if (user) {
      loadPosts();
      loadSuggestions();
      loadChats();
    }  
  }, [user]);

  // useEffect для автоскролла сообщений
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Функция загрузки рекомендаций
  const loadSuggestions = async () => {
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/users/suggestions');
      setSuggestions(res.data.slice(0, 3));
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций:', err);
      setSuggestions([]);
    }
  };

  // ФУНКЦИИ ДЛЯ ЗВОНКОВ
  const initiateCall = async (type = 'audio') => {
    if (!activeChat) return;
    
    try {
      const response = await axios.post('https://server-u9ji.onrender.com/api/calls/initiate', {
        chatId: activeChat._id,
        type: type
      });
      
      console.log('Call initiated successfully:', response.data);
    } catch (err) {
      console.error('Ошибка инициации звонка:', err);
      
      if (err.response?.status === 409) {
        const shouldCleanup = window.confirm(
          'Система думает что вы уже в звонке. Очистить все звонки принудительно?'
        );
        if (shouldCleanup) {
          emergencyCleanup();
        }
      } else if (err.response?.status === 400) {
        alert('Нельзя позвонить самому себе.');
      } else {
        alert('Не удалось начать звонок. Проверьте подключение.');
      }
    }
  };

  // Убрали логирование звонков в чат - они больше не отображаются как сообщения
  const logCallToChat = async (callData) => {
    // Ничего не делаем - звонки не записываются в чат
    return;
  };

  // Обновление профиля пользователя
  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    
    // Также обновляем profile если это текущий пользователь
    if (profile?._id === updatedUser._id || profile?.id === updatedUser.id) {
      setProfile(updatedUser);
    }
  };

  const acceptCall = async () => {
    if (!currentCall) {
      console.error('No current call to accept');
      return;
    }
    
    try {
      console.log('Accepting call with ID:', currentCall.callId || currentCall._id);
      const callId = currentCall.callId || currentCall._id;
      
      await axios.post(`https://server-u9ji.onrender.com/api/calls/accept/${callId}`);
      console.log('Call accepted via API successfully');
      
      // НЕ изменяем состояние здесь - пусть это делает socket событие
      // setCurrentCall(prev => ({ ...prev, status: 'accepted' }));
      
      // Логируем принятый входящий звонок
      await logCallToChat({
        direction: 'incoming',
        status: 'answered',
        duration: 0
      });
      
    } catch (err) {
      console.error('Ошибка принятия звонка:', err);
      alert('Не удалось принять звонок. Попробуйте еще раз.');
      // При ошибке сбрасываем звонок
      setCurrentCall(null);
      setIsIncomingCall(false);
    }
  };

  const declineCall = async () => {
    if (!currentCall) return;
    
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/calls/decline/${currentCall.callId}`);
      
      // Логируем отклоненный входящий звонок
      await logCallToChat({
        direction: 'incoming',
        status: 'declined',
        duration: 0
      });
      
      setCurrentCall(null);
      setIsIncomingCall(false);
    } catch (err) {
      console.error('Ошибка отклонения звонка:', err);
    }
  };

  const endCall = async () => {
    if (!currentCall) return;
    
    console.log('Ending call via API...');
    
    try {
      const callId = currentCall.callId || currentCall._id;
      await axios.post(`https://server-u9ji.onrender.com/api/calls/end/${callId}`);
      console.log('Call ended successfully via API');
    } catch (err) {
      console.error('Ошибка завершения звонка:', err);
      // Принудительно завершаем локально даже если API не сработал
    } finally {
      // В любом случае очищаем локальное состояние
      setCurrentCall(null);
      setIsIncomingCall(false);
      console.log('Local call state cleared');
    }
  };

  // Экстренная очистка всех звонков
  const emergencyCleanup = async (silent = false) => {
    if (!silent) console.log('Emergency cleanup started...');
    try {
      const response = await axios.post('https://server-u9ji.onrender.com/api/calls/cleanup');
      
      // Сбрасываем состояние звонков
      setCurrentCall(null);
      setIsIncomingCall(false);
      
      if (!silent && response.data.cleanedCount > 0) {
        console.log(`Cleaned up ${response.data.cleanedCount} calls`);
        alert(`Очищено ${response.data.cleanedCount} зависших звонков! Теперь можно звонить снова.`);
      } else if (!silent) {
        console.log('No stuck calls found - all good!');
      }
      
      return true;
    } catch (err) {
      if (!silent) {
        console.error('Emergency cleanup failed:', err);
        alert('Не удалось очистить звонки. Обновите страницу (F5).');
      }
      return false;
    }
  };

  // ФУНКЦИИ ДЛЯ ЧАТОВ

  // Предзагрузка сообщений для чатов
  const preloadMessages = async (chatId) => {
    // Не загружаем, если уже есть сообщения этого чата в стейте
    if (messages[chatId]) return;
    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/messages/chats/${chatId}/messages`);
      setMessages(prev => ({ ...prev, [chatId]: res.data }));
    } catch (err) {
      console.error('Ошибка предзагрузки сообщений:', err);
    }
  };

  const loadChats = async () => {
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/messages/chats');
      // Сортируем чаты по времени последнего сообщения
      const sortedChats = res.data.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.lastMessageTime || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.lastMessageTime || b.createdAt;
        return new Date(bTime) - new Date(aTime);
      });
      setChats(sortedChats);

      // Предзагружаем сообщения для каждого чата, чтобы они были сразу доступны
      sortedChats.forEach(chat => preloadMessages(chat._id));
      
      // Собираем ID всех участников всех чатов для загрузки онлайн статусов
      const allParticipantIds = new Set();
      sortedChats.forEach(chat => {
        if (chat.participants) {
          chat.participants.forEach(participant => {
            if (participant._id !== user._id && participant._id !== user.id) {
              allParticipantIds.add(participant._id);
            }
          });
        }
      });
      
      // Загружаем онлайн статусы всех участников
      if (allParticipantIds.size > 0) {
        console.log('Loading online status for all chat participants:', Array.from(allParticipantIds));
        await fetchOnlineStatus(Array.from(allParticipantIds));
      }
      
      const unreadRes = await axios.get('https://server-u9ji.onrender.com/api/messages/unread-count');
      setTotalUnread(unreadRes.data.totalUnread);
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    }
  };

  const loadMessages = async (chatId) => {
    if (messagesLoading || messages[chatId]) return;
    
    setMessagesLoading(true);
    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/messages/chats/${chatId}/messages`);
      console.log('Messages loaded for chat:', res.data);
      setMessages(prev => ({ ...prev, [chatId]: res.data }));
      
      // Загружаем онлайн статусы участников чата
      const currentChat = chats.find(chat => chat._id === chatId);
      if (currentChat && currentChat.participants) {
        const participantIds = currentChat.participants
          .filter(p => p._id !== user._id && p._id !== user.id)
          .map(p => p._id);
        
        if (participantIds.length > 0) {
          console.log('Loading online status for chat participants:', participantIds);
          await fetchOnlineStatus(participantIds);
        }
      }
      
      // Отмечаем как прочитанные
      await axios.put(`https://server-u9ji.onrender.com/api/messages/chats/${chatId}/read`);
      
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
      
      setTotalUnread(prev => Math.max(0, prev - (currentChat?.unreadCount || 0)));
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ИСПРАВЛЕНА функция отправки сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Сразу очищаем поле ввода
    

    
    try {
      const response = await axios.post(`https://server-u9ji.onrender.com/api/messages/chats/${activeChat._id}/messages`, {
        content: messageContent
      });
      
      // Добавляем сообщение локально (оно также придет через Socket.IO, но так быстрее)
      console.log('📤 Sending message, user data:', user);
      console.log('📤 User avatar before sending:', user.avatar);
      
      const newMsg = {
        _id: response.data._id || Date.now().toString(),
        content: messageContent,
        sender: {
          _id: user._id || user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        },
        createdAt: new Date().toISOString(),
        isRead: false
      };
      

      
      setMessages(prev => ({
        ...prev,
        [activeChat._id]: [...(prev[activeChat._id] || []), newMsg]
      }));
      
      // Обновляем чаты в боковом меню
      setChats(prev => prev.map(chat => {
        if (chat._id === activeChat._id) {
          return {
            ...chat,
            lastMessage: newMsg,
            lastMessageTime: new Date().toISOString()
          };
        }
        return chat;
      }));
      
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
      // В случае ошибки возвращаем текст обратно
      setNewMessage(messageContent);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`https://server-u9ji.onrender.com/api/messages/messages/${messageId}`);
    } catch (err) {
      console.error('Ошибка удаления сообщения:', err);
    }
  };

  const startChat = async (userId) => {
    try {
      const res = await axios.post('https://server-u9ji.onrender.com/api/messages/chats', {
        participantId: userId
      });
      
      const existingChat = chats.find(chat => chat._id === res.data._id);
      if (!existingChat) {
        setChats(prev => [res.data, ...prev]);
      }
      
      setActiveChat(res.data);
      setActiveTab('messages');
      loadMessages(res.data._id);
    } catch (err) {
      console.error('Ошибка создания чата:', err);
    }
  };

  // Функция загрузки постов с комментариями
  const loadPosts = async (pageNum = 1, append = false) => {
    if (loading) return;
    
    setLoading(true);
    console.log('Loading posts, page:', pageNum);
    
    try {
      const res = await axios.get('https://server-u9ji.onrender.com/api/posts', {
        params: {
          page: pageNum,
          limit: 10
        }
      });
      
      console.log('Posts API response:', res.data);
      
      let postsData = [];
      if (Array.isArray(res.data)) {
        postsData = res.data;
      } else if (res.data.posts && Array.isArray(res.data.posts)) {
        postsData = res.data.posts;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        postsData = res.data.data;
      }
      
      console.log('Posts data:', postsData);
      
      const formatted = postsData.map(post => {
        console.log('Processing post:', post);
        
        const username = post.author?.username || post.username || 'Unknown';
        
        if (post.comments && Array.isArray(post.comments)) {
          setComments(prev => ({
            ...prev,
            [post._id]: post.comments
          }));
        }
        
        return {
          _id: post._id,
          userId: post.author?._id || post.userId || post.author,
          username: username,
          author: post.author, // Добавляем полный объект автора с аватаркой
          content: post.content,
          likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
          liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
          commentsCount: post.commentsCount || (post.comments ? post.comments.length : 0),
          date: new Date(post.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          isRepost: post.isRepost || false,
          originalPost: post.originalPost || null,
          repostedBy: post.repostedBy || null
        };
      });

      console.log('Formatted posts:', formatted);

      if (append) {
        setPosts(prev => [...prev, ...formatted]);
      } else {
        setPosts(formatted);
      }
      
      setHasMore(formatted.length === 10);
      setPage(pageNum);
      
    } catch (err) {
      console.error('Ошибка загрузки постов:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для загрузки следующей страницы
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    if (!showComments[postId] && !comments[postId]) {
      fetchComments(postId);
    }
  };

  const handleLogout = async () => {
    try {
      const { refreshToken } = getTokens();
      await axios.post('https://server-u9ji.onrender.com/api/auth/logout', {
        refreshToken
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearTokens();
      navigate('/');
    }
  };

  const handleCreatePost = async () => {
    if (postText.trim()) {
      try {
        await axios.post('https://server-u9ji.onrender.com/api/posts', { 
          content: postText 
        });
        setPostText('');
      } catch (err) {
        console.error('Ошибка создания поста:', err);
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/posts/${postId}/like`);
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await axios.post(`https://server-u9ji.onrender.com/api/posts/${postId}/repost`);
      console.log('Repost successful:', res.data);
      // Репост появится через Socket.IO событие 'newRepost'
    } catch (err) {
      console.error('Ошибка репоста:', err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      return;
    }
    
    try {
      await axios.delete(`https://server-u9ji.onrender.com/api/posts/${postId}`);
      
      // Удаляем пост из локального состояния
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      setProfilePosts(prevProfilePosts => prevProfilePosts.filter(post => post._id !== postId));
      
      console.log('Пост успешно удален');
    } catch (err) {
      console.error('Ошибка удаления поста:', err);
      alert('Не удалось удалить пост. Попробуйте еще раз.');
    }
  };

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
    setActiveTab('profile');
    loadUserProfile(searchUser._id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const loadUserProfile = async (userId) => {
    console.log('Loading profile for userId:', userId);
    
    if (!userId) {
      console.error('userId is undefined or null');
      return;
    }
    
    try {
      const res = await axios.get(`https://server-u9ji.onrender.com/api/users/${userId}`);
      console.log('Profile response:', res.data);
      setProfile(res.data);
      
      setFollowers(res.data.followersCount || 0);
      setFollowing(res.data.followingCount || 0);
      
      const postsRes = await axios.get(`https://server-u9ji.onrender.com/api/users/${userId}/posts`);
      console.log('Profile posts response:', postsRes.data);
      
      const formattedProfilePosts = postsRes.data.map(post => ({
        _id: post._id,
        userId: post.author?._id || post.author,
        username: post.author?.username || 'Unknown',
        author: post.author, // Добавляем полный объект автора с аватаркой
        content: post.content,
        likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
        liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
        commentsCount: post.commentsCount || (post.comments ? post.comments.length : 0),
        date: new Date(post.createdAt).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        isRepost: post.isRepost || false,
        originalPost: post.originalPost || null,
        repostedBy: post.repostedBy || null
      }));
      
      setProfilePosts(formattedProfilePosts);
      
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setProfile(null);
      setProfilePosts([]);
      setFollowers(0);
      setFollowing(0);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/follow/${userId}`);
    } catch (err) {
      console.error('Ошибка подписки/отписки:', err);
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;
    
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/posts/${postId}/comment`, 
        { content: commentText }
      );
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (err) {
      console.error('Ошибка добавления комментария:', err);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const getNavItemClass = (tab) => activeTab === tab ? 'active' : '';

  const renderPosts = (postsToRender) => {
    if (!postsToRender || postsToRender.length === 0) {
      return <div className="no-posts">Постов пока нет</div>;
    }

    return postsToRender.map(post => {
      console.log('Rendering post:', post);
      
      return (
        <div key={post._id} className="post">
          {post.isRepost && (
            <div className="repost-header">
              <Repeat size={16} />
              <span>@{post.repostedBy?.username || post.username} репостнул(а)</span>
            </div>
          )}
          
          <div className="post-header">
            <Avatar 
              src={post.isRepost ? post.originalPost?.author?.avatar : post.author?.avatar}
              alt={post.isRepost ? post.originalPost?.author?.displayName || post.originalPost?.author?.username : post.author?.displayName || post.author?.username}
              size="medium"
              onClick={() => loadUserProfile(post.isRepost ? post.originalPost?.author?._id : post.author?._id || post.userId)}
              className="post-avatar"
            />
            <div className="post-author-info">
              <span className="post-author" onClick={() => loadUserProfile(post.isRepost ? post.originalPost?.author?._id : post.author?._id || post.userId)}>
                {post.isRepost 
                  ? post.originalPost?.author?.displayName || post.originalPost?.author?.username || 'Unknown'
                  : post.author?.displayName || post.author?.username || post.displayName || post.username || 'Unknown'
                }
              </span>
              <span className="post-username">
                @{post.isRepost ? post.originalPost?.author?.username || 'Unknown' : post.author?.username || post.username || 'Unknown'}
              </span>
            </div>
            <span className="post-date">
              {post.isRepost && post.originalPost?.createdAt 
                ? new Date(post.originalPost.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : post.date
              }
            </span>
            {(post.isRepost ? post.originalPost?.author?._id : post.userId) === (user._id || user.id) && (
              <button onClick={() => handleDeletePost(post.isRepost ? post.originalPost?._id || post._id : post._id)} className="delete-btn">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          <div className="post-content">
            <p className="post-text">
              {post.isRepost ? post.originalPost?.content || post.content : post.content}
            </p>
          </div>
          
          <div className="post-actions">
            <button 
              onClick={() => handleLikePost(post.isRepost ? post.originalPost?._id || post._id : post._id)} 
              className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
            >
              <Heart size={18} fill={post.liked ? '#f87171' : 'none'} /> 
              <span>{post.likes}</span>
            </button>
            
            <button 
              onClick={() => toggleComments(post.isRepost ? post.originalPost?._id || post._id : post._id)}
              className={`action-btn comment-btn ${showComments[post.isRepost ? post.originalPost?._id || post._id : post._id] ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              <span>{post.commentsCount || comments[post.isRepost ? post.originalPost?._id || post._id : post._id]?.length || 0}</span>
            </button>
            
            <button 
              onClick={() => handleRepost(post.isRepost ? post.originalPost?._id || post._id : post._id)}
              className="action-btn repost-btn"
              disabled={post.isRepost && post.repostedBy?._id === (user._id || user.id)}
            >
              <Repeat size={18} />
              <span>Репост</span>
            </button>

            {post.userId !== (user._id || user.id) && (
              <button 
                onClick={() => startChat(post.userId)}
                className="action-btn message-btn"
              >
                <MessageCircle size={18} />
                <span>Написать</span>
              </button>
            )}
          </div>

          {showComments[post.isRepost ? post.originalPost?._id || post._id : post._id] && (
            <div className="comments-section">
              <div className="comments-header">
                <h4>Комментарии</h4>
                <button 
                  onClick={() => toggleComments(post.isRepost ? post.originalPost?._id || post._id : post._id)}
                  className="close-comments-btn"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="comments-list">
                {(comments[post.isRepost ? post.originalPost?._id || post._id : post._id] || []).map(comment => (
                  <div key={comment._id} className="comment">
                    <Avatar 
                      src={comment.author?.avatar || null}
                      alt={comment.author?.displayName || comment.author?.username || 'Unknown'}
                      size="small"
                      className="comment-avatar"
                    />
                    <div className="comment-body">
                      <div className="comment-header">
                        <div className="comment-info">
                          <span className="comment-username">
                            @{comment.author?.username || 'Unknown'}
                          </span>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                      <div className="comment-content">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="add-comment">
                <div className="comment-input-wrapper">
                  <input
                    type="text"
                    value={newComment[post.isRepost ? post.originalPost?._id || post._id : post._id] || ''}
                    onChange={(e) => handleCommentInputChange(post.isRepost ? post.originalPost?._id || post._id : post._id, e.target.value)}
                    placeholder="Написать комментарий..."
                    className="comment-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(post.isRepost ? post.originalPost?._id || post._id : post._id);
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAddComment(post.isRepost ? post.originalPost?._id || post._id : post._id)}
                    className="send-comment-btn"
                    disabled={!newComment[post.isRepost ? post.originalPost?._id || post._id : post._id]?.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  // Показываем загрузку если пользователь еще не загружен
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
    <div className={`home-container ${activeTab === 'home' ? 'show-right-sidebar' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="logo"><h1><Flame size={24} /> SocialSpace</h1></div>
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
                  <div key={searchUser._id} className="header-search-result" onClick={() => handleSearchClick(searchUser)}>
                    <Avatar 
                      src={searchUser.avatar || null}
                      alt={searchUser.displayName || searchUser.username}
                      size="small"
                      className="search-result-avatar"
                    />
                    <div className="search-result-info">
                      <span className="header-search-username">@{searchUser.username}</span>
                      {searchUser.displayName && (
                        <span className="header-search-name">{searchUser.displayName}</span>
                      )}
                    </div>
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
            
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <nav className="sidebar">
        <ul className="nav-menu">
          <li><button className={getNavItemClass('home')} onClick={() => setActiveTab('home')}><Home size={18} /> Главная</button></li>
          <li><button className={getNavItemClass('messages')} onClick={() => { setActiveTab('messages'); loadChats(); }}>
            <MessageCircle size={18} /> 
            Сообщения
            {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}
          </button></li>
          <li><button className={getNavItemClass('profile')} onClick={() => { setActiveTab('profile'); if(user) loadUserProfile(user._id || user.id); }}><User size={18} /> Профиль</button></li>
        </ul>
      </nav>

      <main className={`main-content ${activeTab === 'messages' ? 'messages-active' : ''}`}>
        {activeTab === 'home' && (
          <div>
            <div className="create-post">
              <div className="create-post-header">
                <h3>Что нового?</h3>
              </div>
              <div className="create-post-body">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Поделитесь своими мыслями..."
                  rows="3"
                  className="create-post-input"
                />
                <div className="create-post-footer">
                  <div className="post-stats">
                    <span className={`char-count ${postText.length > 250 ? 'warning' : ''} ${postText.length > 280 ? 'error' : ''}`}>
                      {postText.length}/280
                    </span>
                  </div>
                  <button 
                    onClick={handleCreatePost} 
                    disabled={!postText.trim() || postText.length > 280}
                    className="publish-btn"
                  >
                    <Plus size={18} /> Опубликовать
                  </button>
                </div>
              </div>
            </div>
            
            <div className="posts-feed">
              {renderPosts(posts)}
              
              {hasMore && posts.length > 0 && (
                <div className="load-more-section">
                  <button 
                    onClick={loadMorePosts} 
                    disabled={loading}
                    className="load-more-btn"
                  >
                    {loading ? (
                      'Загрузка...'
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        Показать ещё
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {!hasMore && posts.length > 0 && (
                <div className="end-of-feed">
                  <p>Больше постов нет</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'messages' && (
          <div className="messages-container">
            <div className="chats-sidebar">
              <div className="chats-header">
                <h3>Чаты</h3>
                {totalUnread > 0 && <span className="total-unread">{totalUnread}</span>}
              </div>
              
              <div className="chats-list">
                {chats.length > 0 ? (
                  chats
                    .sort((a, b) => {
                      // Сортируем по времени последнего сообщения (новые вверху)
                      const aTime = a.lastMessage?.createdAt || a.lastMessageTime || a.createdAt;
                      const bTime = b.lastMessage?.createdAt || b.lastMessageTime || b.createdAt;
                      return new Date(bTime) - new Date(aTime);
                    })
                    .map(chat => {
                    // Находим собеседника для получения его аватарки
                    const otherUser = chat.participants && chat.participants.length === 2 
                      ? chat.participants.find(p => p._id !== user._id && p._id !== user.id)
                      : null;
                    
                    return (
                      <div 
                        key={chat._id} 
                        className={`chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                        onClick={() => { setActiveChat(chat); loadMessages(chat._id); }}
                      >
                        <Avatar 
                          src={otherUser?.avatar || null}
                          alt={otherUser?.displayName || otherUser?.username || chat.name}
                          size="medium"
                          className="chat-avatar"
                        />
                        <div className="chat-info">
                          <div className="chat-header-row">
                            <div className="chat-name">{chat.name}</div>
                            {otherUser && (() => {
                              const userStatus = getUserStatus(otherUser._id);
                              return (
                                <OnlineStatus
                                  userId={otherUser._id}
                                  isOnline={userStatus.isOnline}
                                  lastSeen={userStatus.lastSeen}
                                  showText={false}
                                  size="small"
                                />
                              );
                            })()}
                          </div>
                          {chat.lastMessage && (
                            <div className="chat-last-message">
                              {chat.lastMessage.sender.username}: {chat.lastMessage.content.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="chat-unread">{chat.unreadCount}</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-chats">Чатов пока нет</div>
                )}
              </div>
            </div>
            
            <div className="chat-area">
              {activeChat ? (
                <>
                  <div className="connection-status">
                    {isConnected ? (
                      <><Wifi size={16} /> {connectionStatus}</>
                    ) : (
                      <><WifiOff size={16} /> {connectionStatus}</>
                    )}
                  </div>
                  <div className="chat-header">
                    <div className="chat-header-content">
                      <div className="chat-title-section">
                        <h3>{activeChat.name}</h3>
                        {/* Онлайн статус собеседника */}
                        {activeChat.participants && activeChat.participants.length === 2 && (() => {
                          const otherUser = activeChat.participants.find(p => p._id !== user._id && p._id !== user.id);
                          const userStatus = getUserStatus(otherUser?._id);
                          return (
                            <OnlineStatus
                              userId={otherUser?._id}
                              isOnline={userStatus.isOnline}
                              lastSeen={userStatus.lastSeen}
                              showText={true}
                              size="medium"
                            />
                          );
                        })()}
                      </div>
                      <div className="chat-call-buttons">
                        <button 
                          onClick={() => initiateCall('audio')}
                          className="call-button audio-call"
                          title="Голосовой звонок"
                        >
                          <Phone size={18} />
                        </button>
                        <button 
                          onClick={() => initiateCall('video')}
                          className="call-button video-call"
                          title="Видео звонок"
                        >
                          <Video size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="messages-area">
                    {messagesLoading ? (
                      <div className="messages-loading">Загрузка сообщений...</div>
                    ) : (
                      <>
                        {(messages[activeChat._id] || []).map(message => {
                          // Пропускаем сообщения о звонках - не отображаем их
                          if (message.type === 'call') {
                            return null;
                          }
                          
                          // Обычное сообщение
                          return (
                            <div 
                              key={message._id} 
                              className={`message ${message.sender._id === (user._id || user.id) ? 'own' : 'other'}`}
                            >
                              <div className="message-avatar">

                                <Avatar 
                                  src={message.sender?.avatar || null}
                                  alt={message.sender?.displayName || message.sender?.username || 'Unknown'}
                                  size="small"
                                  className="chat-message-avatar"
                                />
                              </div>
                              <div className="message-body">
                                <div className="message-header">
                                  <span className="message-sender">{message.sender.username}</span>
                                  <span className="message-time">
                                    {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {message.sender._id === (user._id || user.id) && (
                                    <button 
                                      onClick={() => deleteMessage(message._id)}
                                      className="delete-message-btn"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                <div className="message-content">{message.content}</div>
                              </div>
                            </div>
                          );
                        })}
                        {typingUsers[activeChat?._id] && (
                          <div className="typing-indicator">
                            {typingUsers[activeChat._id].username} печатает...
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                  
                  <div className="message-input-area">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (activeChat) {
                          socketRef.current.emit('typing', {
                            chatId: activeChat._id,
                            isTyping: e.target.value.length > 0
                          });
                        }
                      }}
                      placeholder="Написать сообщение..."
                      className="message-input"
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button 
                      onClick={sendMessage} 
                      className="send-message-btn"
                      disabled={!newMessage.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-active-chat">
                  <h3>Выберите чат для начала общения</h3>
                  <p>Вы можете начать новый чат, нажав "Написать" под постом пользователя</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && profile && (
          <div className="profile-view">
            <div className="profile-header">
              <div className="profile-content">
                <div className="profile-main-info">
                  <div className="profile-avatar-section">
                    <Avatar 
                      src={profile.avatar || null} 
                      alt={profile.displayName || profile.username}
                      size="xlarge"
                    />
                  </div>
                  <div className="profile-info">
                    <div className="profile-header-row">
                      <h2 className="profile-display-name">
                        {profile.displayName || profile.username}
                        {isOwnProfile() && (
                          <span className="own-profile-badge">
                            <UserCheck size={16} /> Ваш профиль
                          </span>
                        )}
                      </h2>
                      {isOwnProfile() && (
                        <button 
                          className="profile-settings-btn"
                          onClick={() => setShowProfileSettings(true)}
                          title="Настройки профиля"
                        >
                          <Settings size={20} />
                        </button>
                      )}
                    </div>
                    <p className="profile-handle">@{profile.username}</p>
                    {profile.bio && (
                      <p className="profile-bio">{profile.bio}</p>
                    )}
                    
                    <div className="profile-stats">
                      <div className="profile-stat">
                        <span className="stat-number">{followers}</span>
                        <span className="stat-label">Подписчиков</span>
                      </div>
                      <div className="profile-stat">
                        <span className="stat-number">{following}</span>
                        <span className="stat-label">Подписки</span>
                      </div>
                      <div className="profile-stat">
                        <span className="stat-number">{profilePosts.length}</span>
                        <span className="stat-label">Постов</span>
                      </div>
                    </div>
                    
                    {!isOwnProfile() && (
                      <div className="profile-actions">
                        <button 
                          className={`follow-btn ${profile.followed ? 'following' : ''}`}
                          onClick={() => toggleFollow(profile._id)}
                        >
                          {profile.followed ? (
                            <>
                              <UserCheck size={16} /> Отписаться
                            </>
                          ) : (
                            <>
                              <Users size={16} /> Подписаться
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => startChat(profile._id)}
                          className="follow-btn"
                        >
                          <MessageCircle size={16} /> Написать
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-posts-header">
              <h3>
                <Pencil size={18} /> 
                Посты {isOwnProfile() ? '(ваши)' : ''}
              </h3>
              {profilePosts.length > 0 && (
                <span className="posts-count">{profilePosts.length} постов</span>
              )}
            </div>

            {profilePosts.length > 0 ? (
              <div className="posts-feed">
                {renderPosts(profilePosts)}
              </div>
            ) : (
              <div className="no-posts">
                {isOwnProfile() ? 
                  'У вас пока нет постов. Создайте свой первый пост!' : 
                  `У @${profile.username} пока нет постов`
                }
              </div>
            )}
          </div>
        )}
      </main>

      <aside className="right-sidebar">
        <div className="changelog">
          <h3><Clock size={18} /> Список изменений</h3>
          <div className="changelog-content">
            {changelogData.map((version, index) => (
              <div key={version.version} className="version-block">
                <div className="version-header">
                  <span className="version-number">v{version.version}</span>
                  <span className="version-date">{version.date}</span>
                </div>
                <ul className="changes-list">
                  {version.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="change-item">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="suggestions">
          <h3><Users size={18} /> Рекомендации</h3>
          {suggestions.length > 0 ? (
            suggestions.map(suggestionUser => (
              <div key={suggestionUser._id} className="user-suggestion">
                <div className="suggestion-info">
                  <Avatar 
                    src={suggestionUser.avatar || null}
                    alt={suggestionUser.displayName || suggestionUser.username}
                    size="medium"
                  />
                  <div className="suggestion-user-details">
                    <span className="suggestion-display-name">
                      {suggestionUser.displayName || suggestionUser.username}
                    </span>
                    <span className="suggestion-username">@{suggestionUser.username}</span>
                    <span className="suggestion-stats">
                      {suggestionUser.followersCount || 0} подписчиков
                    </span>
                  </div>
                </div>
                <div className="suggestion-actions">
                  <button 
                    onClick={() => toggleFollow(suggestionUser._id)}
                    className="suggestion-follow-btn"
                  >
                    <Users size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">Рекомендации загружаются...</div>
          )}
        </div>
      </aside>

      {/* ИНТЕРФЕЙС ЗВОНКА */}
            {currentCall && (
        <CallInterface
          call={currentCall}
          onEndCall={endCall}
          onAcceptCall={acceptCall}
          onDeclineCall={declineCall}
          isIncoming={isIncomingCall}
          socket={socketRef.current}
        />
      )}
      
      {showProfileSettings && (
        <ProfileSettings
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default HomePage;