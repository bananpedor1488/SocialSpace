import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

import {
  Home, Search, MessageCircle, User, LogOut, Flame, Plus,
  Heart, MessageSquare, Repeat, Pencil, Trash2, Users, UserCheck, Send, X, ChevronDown,
  Moon, Sun, Wifi, WifiOff
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
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();
  const socketRef = useRef(null);

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

  const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    
    if (!refreshToken || isTokenExpired(refreshToken)) {
      throw new Error('Refresh token expired');
    }

    try {
      const response = await axios.post('https://server-1-vr19.onrender.com/api/auth/refresh', {
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

  // Socket.IO подключение
  useEffect(() => {
    const initSocket = () => {
      const { accessToken } = getTokens();
      if (!accessToken || !user) return;

      socketRef.current = io('https://server-1-vr19.onrender.com', {
        auth: {
          token: accessToken
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      // Слушатели событий
      socketRef.current.on('newPost', (newPost) => {
        console.log('New post received:', newPost);
        setPosts(prev => [newPost, ...prev]);
      });

      socketRef.current.on('postLiked', (data) => {
        console.log('Post liked:', data);
        setPosts(prev => prev.map(post => 
          post._id === data.postId ? { 
            ...post, 
            liked: data.userId === user.id ? data.liked : post.liked,
            likes: data.likesCount 
          } : post
        ));

        if (activeTab === 'profile') {
          setProfilePosts(prev => prev.map(post => 
            post._id === data.postId ? { 
              ...post, 
              liked: data.userId === user.id ? data.liked : post.liked,
              likes: data.likesCount 
            } : post
          ));
        }
      });

      socketRef.current.on('newComment', (data) => {
        console.log('New comment received:', data);
        const { postId, comment, commentsCount } = data;
        
        // Обновляем комментарии для поста
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));

        // Обновляем счетчик комментариев в постах
        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            commentsCount: commentsCount,
            comments: post.comments ? [...post.comments, comment] : [comment]
          } : post
        ));

        if (activeTab === 'profile') {
          setProfilePosts(prev => prev.map(post => 
            post._id === postId ? { 
              ...post, 
              commentsCount: commentsCount,
              comments: post.comments ? [...post.comments, comment] : [comment]
            } : post
          ));
        }
      });

      socketRef.current.on('postDeleted', (data) => {
        console.log('Post deleted:', data);
        setPosts(prev => prev.filter(post => post._id !== data.postId));
        
        if (activeTab === 'profile') {
          setProfilePosts(prev => prev.filter(post => post._id !== data.postId));
        }
      });

      socketRef.current.on('followUpdate', (data) => {
        console.log('Follow update:', data);
        if (profile && profile._id === data.targetUserId) {
          setProfile(prev => ({
            ...prev,
            followed: data.followerId === user.id ? data.followed : prev.followed,
            followersCount: data.followersCount
          }));
          setFollowers(data.followersCount);
        }
        
        // Обновляем рекомендации
        setSuggestions(prev => prev.map(suggestion => 
          suggestion._id === data.targetUserId ? {
            ...suggestion,
            followed: data.followerId === user.id ? data.followed : suggestion.followed,
            followersCount: data.followersCount
          } : suggestion
        ));
      });

      socketRef.current.on('newFollower', (data) => {
        console.log('New follower:', data);
        // Можно добавить уведомление о новом подписчике
      });
    };

    if (user) {  
      initSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, activeTab, profile]);

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
            } catch (error) {
              clearTokens();
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
  }, [navigate]);

  // Cookie функции для темы
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
          setUser(JSON.parse(savedUser));
        }

        const res = await axios.get('https://server-1-vr19.onrender.com/api/me');
        console.log('Current user data:', res.data.user);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } catch (error) {
        console.error('Auth check failed:', error);
        clearTokens();
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    try {
      const res = await axios.get('https://server-1-vr19.onrender.com/api/users/suggestions');
      setSuggestions(res.data.slice(0, 5));
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций:', err);
      setSuggestions([]);
    }
  };

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
      
      const formatted = postsData.map(post => {
        const username = post.author?.username || post.username || 'Unknown';
        
        // Инициализируем комментарии из поста
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
          content: post.content,
          likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
          liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
          commentsCount: post.commentsCount || 0,
          comments: post.comments || [],
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

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`https://server-1-vr19.onrender.com/api/posts/${postId}/comments`);
      setComments(prev => ({ 
        ...prev, 
        [postId]: res.data.comments || res.data 
      }));
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // Если комментарии уже загружены, не перезагружаем
    if (!comments[postId] || comments[postId].length === 0) {
      fetchComments(postId);
    }
  };

  const handleLogout = async () => {
    try {
      const { refreshToken } = getTokens();
      await axios.post('https://server-1-vr19.onrender.com/api/auth/logout', {
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
        const res = await axios.post('https://server-1-vr19.onrender.com/api/posts', { 
          content: postText 
        });
        console.log('New post response:', res.data);
        
        // Пост уже будет добавлен через Socket.IO событие
        // Но на всякий случай, если сокет не работает:
        if (!isConnected) {
          const newPost = {
            _id: res.data._id,
            userId: res.data.author?._id || res.data.author,
            username: res.data.author?.username || user?.username,
            content: res.data.content,
            likes: 0,
            liked: false,
            commentsCount: 0,
            comments: [],
            date: new Date().toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          };
          setPosts(prev => [newPost, ...prev]);
        }
        
        setPostText('');
      } catch (err) {
        console.error('Ошибка создания поста:', err);
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/posts/${postId}/like`);
      
      // Обновление произойдет через Socket.IO, но на всякий случай:
      if (!isConnected) {
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
      }
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/posts/${postId}/repost`);
      // Репост будет добавлен через Socket.IO событие
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
      
      const formattedProfilePosts = postsRes.data.map(post => {
        // Инициализируем комментарии из поста профиля
        if (post.comments && Array.isArray(post.comments)) {
          setComments(prev => ({
            ...prev,
            [post._id]: post.comments
          }));
        }
        
        return {
          _id: post._id,
          userId: post.author?._id || post.author,
          username: post.author?.username || 'Unknown',
          content: post.content,
          likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
          liked: Array.isArray(post.likes) && user ? post.likes.includes(user._id || user.id) : false,
          commentsCount: post.commentsCount || 0,
          comments: post.comments || [],
          date: new Date(post.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });
      
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
      const res = await axios.post(`https://server-1-vr19.onrender.com/api/users/follow/${userId}`);
      
      // Обновление произойдет через Socket.IO, но на всякий случай:
      if (!isConnected) {
        if (userId === profile?._id) {
          setProfile(prev => ({
            ...prev,
            followed: res.data.following,
            followersCount: res.data.followersCount
          }));
          setFollowers(res.data.followersCount);
        }
        
        setSuggestions(prev => prev.map(suggestion => 
          suggestion._id === userId ? {
            ...suggestion,
            followed: res.data.following,
            followersCount: res.data.followersCount
          } : suggestion
        ));
      }
      
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
      
      // Комментарий будет добавлен через Socket.IO, но на всякий случай:
      if (!isConnected) {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data],
        }));
      }
      
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
              <span>{post.commentsCount || comments[post._id]?.length || 0}</span>
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
    <div className="home-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>
              <Flame size={24} /> SocialSpace
              <span className="connection-status">
                {isConnected ? (
                  <Wifi size={16} style={{ color: '#10b981', marginLeft: '8px' }} />
                ) : (
                  <WifiOff size={16} style={{ color: '#ef4444', marginLeft: '8px' }} />
                )}
              </span>
            </h1>
          </div>
          <div className="user-info">
            <span>Привет, {user?.username}!</span>
            
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
          <li><button className={getNavItemClass('search')} onClick={() => setActiveTab('search')}><Search size={18} /> Поиск</button></li>
          <li><button className={getNavItemClass('profile')} onClick={() => { setActiveTab('profile'); if(user) loadUserProfile(user._id || user.id); }}><User size={18} /> Профиль</button></li>
        </ul>
      </nav>

      <main className="main-content">
        {activeTab === 'home' && (
          <div>
            <div className="create-post">
              <div className="create-post-header">
                <h3>Что нового?</h3>
                {!isConnected && (
                  <div className="offline-warning" style={{ 
                    color: '#ef4444', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    <WifiOff size={14} />
                    Нет подключения
                  </div>
                )}
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
                          <UserCheck size={16} /> Ваш профиль
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
                              <UserCheck size={16} /> Отписаться
                            </>
                          ) : (
                            <>
                              <Users size={16} /> Подписаться
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
        <div className="trending">
          <h3><Flame size={18} /> В тренде</h3>
          <ul>
            <li><span>#JavaScript</span><small>1,234 постов</small></li>
            <li><span>#React</span><small>987 постов</small></li>
            <li><span>#WebDev</span><small>856 постов</small></li>
            <li><span>#CSS</span><small>643 постов</small></li>
            <li><span>#Node</span><small>521 постов</small></li>
          </ul>
        </div>

        <div className="suggestions">
          <h3><Users size={18} /> Рекомендации</h3>
          {!isConnected && (
            <div className="offline-notice" style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginBottom: '8px' 
            }}>
              Обновления в реальном времени недоступны
            </div>
          )}
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
                    <Users size={14} /> Подписаться
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">Рекомендации загружаются...</div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default HomePage;