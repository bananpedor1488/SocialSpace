import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  Home, Search, MessageCircle, User, LogOut, Flame, Plus,
  Heart, MessageSquare, Repeat, Pencil, Trash2, Users, UserCheck, Send, X, ChevronDown,
  Moon, Sun
} from 'lucide-react';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [postText, setPostText] = useState('');
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
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const navigate = useNavigate();

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
    console.log('Clearing all tokens and user data');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // Функция для декодирования JWT токена (проверка на истечение)
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      // Добавляем буферное время 30 секунд для предотвращения проблем с синхронизацией времени
      return payload.exp < (currentTime + 30);
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Функция обновления токена
  const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Проверяем срок действия refresh токена
    if (isTokenExpired(refreshToken)) {
      throw new Error('Refresh token expired');
    }

    try {
      console.log('Refreshing access token...');
      const response = await axios.post('https://server-1-vr19.onrender.com/api/auth/refresh', {
        refreshToken: refreshToken
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      console.log('Token refreshed successfully');
      setTokens(accessToken, newRefreshToken || refreshToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      throw error;
    }
  };

  // Функция для безопасных API запросов с повторными попытками
  const makeAuthenticatedRequest = async (requestFn, maxRetries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Проверяем токены перед каждой попыткой
        const { refreshToken } = getTokens();
        
        if (!refreshToken || isTokenExpired(refreshToken)) {
          console.log('No valid refresh token available');
          clearTokens();
          setUser(null);
          navigate('/');
          throw new Error('Authentication expired');
        }

        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 401 && attempt < maxRetries) {
          console.log(`Request failed with 401, attempt ${attempt + 1}/${maxRetries + 1}, trying to refresh token...`);
          
          try {
            await refreshAccessToken();
            console.log('Token refreshed successfully, retrying request...');
            continue; // Повторяем запрос
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearTokens();
            setUser(null);
            navigate('/');
            throw refreshError;
          }
        } else {
          // Если это не 401 или превышено количество попыток
          throw error;
        }
      }
    }
    
    throw lastError;
  };

  // Настройка axios interceptors для JWT с мобильной поддержкой
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        // Добавляем таймауты для мобильных устройств
        config.timeout = 30000; // 30 секунд
        
        // Пропускаем добавление токена для публичных эндпоинтов
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          let { accessToken } = getTokens();
          
          // Проверяем, не истек ли токен
          if (!accessToken || isTokenExpired(accessToken)) {
            try {
              console.log('Access token expired, refreshing...');
              accessToken = await refreshAccessToken();
            } catch (error) {
              console.error('Token refresh failed in request interceptor:', error);
              return config;
            }
          }
          
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        
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
            console.log('401 error, attempting token refresh...');
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            console.log('Retrying original request with new token');
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed in response interceptor:', refreshError);
            clearTokens();
            if (window.location.pathname !== '/') {
              navigate('/');
            }
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
  }, [navigate]);

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

  // Проверяем, является ли профиль собственным
  const isOwnProfile = () => {
    if (!user || !profile) return false;
    return profile._id === user._id || profile._id === user.id;
  };

  // Получаем текущего пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Starting auth check...');
      setAuthCheckComplete(false);
      
      const { accessToken, refreshToken } = getTokens();
      
      // Если нет токенов вообще, сразу перенаправляем
      if (!accessToken && !refreshToken) {
        console.log('No tokens found, redirecting to login');
        setAuthCheckComplete(true);
        navigate('/');
        return;
      }

      try {
        // Сначала пробуем получить пользователя из localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          console.log('Loading user from localStorage');
          setUser(JSON.parse(savedUser));
        }

        // Проверяем и обновляем токены если нужно
        let currentAccessToken = accessToken;
        
        if (!currentAccessToken || isTokenExpired(currentAccessToken)) {
          if (refreshToken && !isTokenExpired(refreshToken)) {
            try {
              console.log('Refreshing expired access token...');
              currentAccessToken = await refreshAccessToken();
            } catch (refreshError) {
              console.error('Token refresh failed during init:', refreshError);
              clearTokens();
              setUser(null);
              setAuthCheckComplete(true);
              navigate('/');
              return;
            }
          } else {
            console.log('Both tokens expired, redirecting to login');
            clearTokens();
            setUser(null);
            setAuthCheckComplete(true);
            navigate('/');
            return;
          }
        }

        // Получаем актуальные данные пользователя с сервера
        console.log('Fetching current user data from server...');
        const res = await axios.get('https://server-1-vr19.onrender.com/api/me', {
          headers: {
            Authorization: `Bearer ${currentAccessToken}`
          }
        });
        console.log('User data received:', res.data.user);
        
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setAuthCheckComplete(true);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // Если ошибка 401, пробуем обновить токен
        if (error.response?.status === 401 && refreshToken && !isTokenExpired(refreshToken)) {
          try {
            console.log('Retrying with token refresh after 401...');
            const newAccessToken = await refreshAccessToken();
            const res = await axios.get('https://server-1-vr19.onrender.com/api/me', {
              headers: {
                Authorization: `Bearer ${newAccessToken}`
              }
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setAuthCheckComplete(true);
            return;
          } catch (refreshError) {
            console.error('Token refresh retry failed:', refreshError);
          }
        }
        
        console.log('Auth check completely failed, clearing tokens');
        clearTokens();
        setUser(null);
        setAuthCheckComplete(true);
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Периодическая проверка токенов с адаптацией для мобильных устройств
  useEffect(() => {
    if (!user || !authCheckComplete) return;

    const checkTokensPeriodically = async () => {
      const { accessToken, refreshToken } = getTokens();
      
      // Если нет refresh токена, выходим
      if (!refreshToken) {
        console.log('No refresh token found during periodic check, logging out');
        clearTokens();
        setUser(null);
        navigate('/');
        return;
      }

      // Если refresh токен истек, выходим
      if (isTokenExpired(refreshToken)) {
        console.log('Refresh token expired during periodic check, logging out');
        clearTokens();
        setUser(null);
        navigate('/');
        return;
      }

      // Если access токен истек или истекает в ближайшие 5 минут, обновляем
      if (!accessToken || isTokenExpired(accessToken)) {
        console.log('Access token needs refresh during periodic check');
        try {
          await refreshAccessToken();
          console.log('Periodic token refresh successful');
        } catch (error) {
          console.error('Periodic token refresh failed:', error);
          clearTokens();
          setUser(null);
          navigate('/');
        }
      }
    };

    // Проверяем токены сразу
    checkTokensPeriodically();

    // Устанавливаем интервал проверки каждые 3 минуты
    const interval = setInterval(checkTokensPeriodically, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, authCheckComplete, navigate]);

  // Обработка событий видимости страницы (важно для мобильных устройств)
  useEffect(() => {
    if (!user || !authCheckComplete) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('App became visible, checking tokens...');
        const { accessToken, refreshToken } = getTokens();
        
        if (!refreshToken || isTokenExpired(refreshToken)) {
          console.log('Tokens expired while app was in background');
          clearTokens();
          setUser(null);
          navigate('/');
          return;
        }

        // Если access токен истек, обновляем его
        if (!accessToken || isTokenExpired(accessToken)) {
          try {
            console.log('Refreshing token after app became visible');
            await refreshAccessToken();
          } catch (error) {
            console.error('Token refresh on visibility change failed:', error);
            clearTokens();
            setUser(null);
            navigate('/');
          }
        }
      }
    };

    // Также проверяем при изменении фокуса окна
    const handleFocus = async () => {
      if (user && authCheckComplete) {
        const { refreshToken } = getTokens();
        if (!refreshToken || isTokenExpired(refreshToken)) {
          console.log('Session expired, logging out');
          clearTokens();
          setUser(null);
          navigate('/');
        }
      }
    };

    // Обработка событий для мобильных устройств
    const handlePageShow = async () => {
      if (user && authCheckComplete) {
        console.log('Page show event, checking auth...');
        const { refreshToken } = getTokens();
        if (!refreshToken || isTokenExpired(refreshToken)) {
          clearTokens();
          setUser(null);
          navigate('/');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [user, authCheckComplete, navigate]);

  // Получаем посты при загрузке пользователя
  useEffect(() => {
    if (user) {
      loadPosts();
      loadSuggestions();
    }
  }, [user]);

  // Функция загрузки рекомендаций
  const loadSuggestions = async () => {
    try {
      const res = await axios.get('https://server-1-vr19.onrender.com/api/users/suggestions');
      setSuggestions(res.data.slice(0, 5));
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций:', err);
      setSuggestions([]);
    }
  };

  // Функция загрузки постов
  const loadPosts = async (pageNum = 1, append = false) => {
    if (loading) return;
    
    setLoading(true);
    console.log('Loading posts, page:', pageNum);
    
    try {
      const res = await axios.get('https://server-1-vr19.onrender.com/api/posts', {
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
        console.log('Post author:', post.author);
        
        const username = post.author?.username || post.username || 'Unknown';
        console.log('Extracted username:', username);
        
        return {
          _id: post._id,
          userId: post.author?._id || post.userId || post.author,
          username: username,
          content: post.content,
          likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
          liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
          date: new Date(post.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
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
      const res = await axios.get(`https://server-1-vr19.onrender.com/api/posts/${postId}/comments`);
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
    console.log('Starting logout process...');
    
    try {
      const { refreshToken } = getTokens();
      if (refreshToken) {
        console.log('Sending logout request to server...');
        await axios.post('https://server-1-vr19.onrender.com/api/auth/logout', {
          refreshToken
        });
        console.log('Server logout successful');
      }
    } catch (error) {
      console.warn('Server logout request failed:', error);
    } finally {
      console.log('Clearing local tokens and redirecting...');
      clearTokens();
      setUser(null);
      setAuthCheckComplete(false);
      navigate('/');
    }
  };

  const handleCreatePost = async () => {
    if (postText.trim()) {
      try {
        const res = await axios.post('https://server-1-vr19.onrender.com/api/posts', { 
          content: postText 
        });
        console.log('New post response:', res.data);
        
        const newPost = {
          _id: res.data._id,
          userId: res.data.author?._id || res.data.author,
          username: res.data.author?.username || user?.username,
          content: res.data.content,
          likes: 0,
          liked: false,
          date: new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        console.log('New post formatted:', newPost);
        setPosts([newPost, ...posts]);
        setPostText('');
      } catch (err) {
        console.error('Ошибка создания поста:', err);
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/posts/${postId}/like`);
      
      setPosts(prev => prev.map(post => 
        post._id === postId ? { 
          ...post, 
          liked: res.data.liked, 
          likes: res.data.likes 
        } : post
      ));
      
      if (activeTab === 'profile') {
        setProfilePosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            liked: res.data.liked, 
            likes: res.data.likes 
          } : post
        ));
      }
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/posts/${postId}/repost`);
      loadPosts();
    } catch (err) {
      console.error('Ошибка репоста:', err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const res = await axios.get(`https://server-1-vr19.onrender.com/api/users/search?query=${query}`);
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
      const res = await axios.get(`https://server-1-vr19.onrender.com/api/users/${userId}`);
      console.log('Profile response:', res.data);
      setProfile(res.data);
      
      setFollowers(res.data.followersCount || 0);
      setFollowing(res.data.followingCount || 0);
      
      const postsRes = await axios.get(`https://server-1-vr19.onrender.com/api/users/${userId}/posts`);
      console.log('Profile posts response:', postsRes.data);
      
      const formattedProfilePosts = postsRes.data.map(post => ({
        _id: post._id,
        userId: post.author?._id || post.author,
        username: post.author?.username || 'Unknown',
        content: post.content,
        likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
        liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
        date: new Date(post.createdAt).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
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
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/follow/${userId}`);
      
      // Обновляем профиль если это текущий просматриваемый профиль
      if (userId === profile?._id) {
        loadUserProfile(profile._id);
      }
      
      // Обновляем рекомендации
      loadSuggestions();
    } catch (err) {
      console.error('Ошибка подписки/отписки:', err);
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;
    
    try {
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/posts/${postId}/comment`, 
        { content: commentText }
      );
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data],
      }));
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
          <div className="post-header">
            <div className="post-user-info">
              <div className="user-details">
                <span className="username">@{post.username || 'Unknown'}</span>
                <span className="post-date">{post.date}</span>
              </div>
            </div>
          </div>
          
          <div className="post-content">
            <p className="post-text">{post.content}</p>
          </div>
          
          <div className="post-actions">
            <button 
              onClick={() => handleLikePost(post._id)} 
              className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
            >
              <Heart size={18} fill={post.liked ? '#f87171' : 'none'} /> 
              <span>{post.likes}</span>
            </button>
            
            <button 
              onClick={() => toggleComments(post._id)}
              className={`action-btn comment-btn ${showComments[post._id] ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              <span>{comments[post._id]?.length || 0}</span>
            </button>
            
            <button 
              onClick={() => handleRepost(post._id)}
              className="action-btn repost-btn"
            >
              <Repeat size={18} />
              <span>Репост</span>
            </button>
          </div>

          {showComments[post._id] && (
            <div className="comments-section">
              <div className="comments-header">
                <h4>Комментарии</h4>
                <button 
                  onClick={() => toggleComments(post._id)}
                  className="close-comments-btn"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="comments-list">
                {(comments[post._id] || []).map(comment => (
                  <div key={comment._id} className="comment">
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
                ))}
              </div>
              
              <div className="add-comment">
                <div className="comment-input-wrapper">
                  <input
                    type="text"
                    value={newComment[post._id] || ''}
                    onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                    placeholder="Написать комментарий..."
                    className="comment-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(post._id);
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAddComment(post._id)}
                    className="send-comment-btn"
                    disabled={!newComment[post._id]?.trim()}
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

  // Показываем загрузку если проверка авторизации не завершена
  if (!authCheckComplete) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ marginBottom: '20px', fontSize: '32px' }}>🔐</div>
          <div>Проверяем авторизацию...</div>
        </div>
      </div>
    );
  }

  // Показываем загрузку если пользователь еще не загружен, но авторизация проверена
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ marginBottom: '20px', fontSize: '32px' }}>⏳</div>
          <div>Загружаем данные пользователя...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-content">
          <div className="logo"><h1><Flame size={24} /> SocialSpace</h1></div>
          <div className="user-info">
            <span className="user-greeting">Привет, {user?.username}!</span>
            
            <button onClick={toggleTheme} className="theme-toggle">
              <div className="theme-icon">
                {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <span className="theme-text">
                {isDarkTheme ? 'Светлая' : 'Темная'}
              </span>
            </button>
            
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} /> 
              <span className="logout-text">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="sidebar">
        <ul className="nav-menu">
          <li>
            <button 
              className={getNavItemClass('home')} 
              onClick={() => setActiveTab('home')}
            >
              <Home size={18} /> 
              <span className="nav-text">Главная</span>
            </button>
          </li>
          <li>
            <button 
              className={getNavItemClass('search')} 
              onClick={() => setActiveTab('search')}
            >
              <Search size={18} /> 
              <span className="nav-text">Поиск</span>
            </button>
          </li>
          <li>
            <button 
              className={getNavItemClass('profile')} 
              onClick={() => { 
                setActiveTab('profile'); 
                if(user) loadUserProfile(user._id || user.id); 
              }}
            >
              <User size={18} /> 
              <span className="nav-text">Профиль</span>
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
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
                    <Plus size={18} /> 
                    <span className="publish-text">Опубликовать</span>
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
                        <span>Показать ещё</span>
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
        
        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Поиск пользователей..."
                className="search-input"
              />
            </div>
            
            {searchResults.length > 0 ? (
              <div className="search-results-list">
                <h3>Найдено пользователей: {searchResults.length}</h3>
                {searchResults.map(searchUser => (
                  <div key={searchUser._id} className="search-result-item" onClick={() => handleSearchClick(searchUser)}>
                    <div className="search-user-info">
                      <span className="search-username">@{searchUser.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              searchQuery && <div className="no-results">Пользователи не найдены</div>
            )}
          </div>
        )}
        
        {activeTab === 'profile' && profile && (
          <div className="profile-view">
            <div className="profile-header">
              <div className="profile-content">
                <div className="profile-main-info">
                  <div className="profile-info">
                    <h2 className="profile-username">
                      {profile.username}
                      {isOwnProfile() && (
                        <span className="own-profile-badge">
                          <UserCheck size={16} /> 
                          <span className="badge-text">Ваш профиль</span>
                        </span>
                      )}
                    </h2>
                    <p className="profile-handle">@{profile.username}</p>
                    
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
                              <UserCheck size={16} /> 
                              <span>Отписаться</span>
                            </>
                          ) : (
                            <>
                              <Users size={16} /> 
                              <span>Подписаться</span>
                            </>
                          )}
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
                <span>Посты {isOwnProfile() ? '(ваши)' : ''}</span>
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
        <div className="trending">
          <h3><Flame size={18} /> <span>В тренде</span></h3>
          <ul>
            <li>
              <span className="trend-tag">#JavaScript</span>
              <small>1,234 постов</small>
            </li>
            <li>
              <span className="trend-tag">#React</span>
              <small>987 постов</small>
            </li>
            <li>
              <span className="trend-tag">#WebDev</span>
              <small>856 постов</small>
            </li>
            <li>
              <span className="trend-tag">#CSS</span>
              <small>643 постов</small>
            </li>
            <li>
              <span className="trend-tag">#Node</span>
              <small>521 постов</small>
            </li>
          </ul>
        </div>

        <div className="suggestions">
          <h3><Users size={18} /> <span>Рекомендации</span></h3>
          {suggestions.length > 0 ? (
            suggestions.map(suggestionUser => (
              <div key={suggestionUser._id} className="user-suggestion">
                <div className="suggestion-info">
                  <div className="suggestion-user-details">
                    <span className="suggestion-username">@{suggestionUser.username}</span>
                    <span className="suggestion-stats">
                      {suggestionUser.followersCount || 0} подписчиков
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleFollow(suggestionUser._id)}
                    className="suggestion-follow-btn"
                  >
                    <Users size={14} /> 
                    <span>Подписаться</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">Рекомендации загружаются...</div>
          )}
        </div>
      </aside>

      {/* Мобильная навигация внизу */}
      <nav className="mobile-nav">
        <button 
          className={getNavItemClass('home')} 
          onClick={() => setActiveTab('home')}
        >
          <Home size={24} />
          <span>Главная</span>
        </button>
        <button 
          className={getNavItemClass('search')} 
          onClick={() => setActiveTab('search')}
        >
          <Search size={24} />
          <span>Поиск</span>
        </button>
        <button 
          className={getNavItemClass('profile')} 
          onClick={() => { 
            setActiveTab('profile'); 
            if(user) loadUserProfile(user._id || user.id); 
          }}
        >
          <User size={24} />
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  );
};

export default HomePage;