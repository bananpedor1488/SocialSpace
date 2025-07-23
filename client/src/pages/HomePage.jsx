import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, tokenManager } from './AuthPage';

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

  const navigate = useNavigate();

  // Функция для работы с куки
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
    // Удаляем предыдущий CSS файл если есть
    const existingLink = document.getElementById('homepage-theme-css');
    if (existingLink) {
      existingLink.remove();
    }

    // Создаем новый link элемент
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
      loadCSS('HomePage.css'); // Темная тема
    } else {
      setIsDarkTheme(false);
      loadCSS('HomePage1.css'); // Светлая тема
    }
  }, []);

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    setCookie('theme', newTheme ? 'dark' : 'light');
    
    // Загружаем соответствующий CSS файл
    if (newTheme) {
      loadCSS('HomePage.css'); // Темная тема
    } else {
      loadCSS('HomePage1.css'); // Светлая тема
    }
  };

  // Проверяем, является ли профиль собственным
  const isOwnProfile = () => {
    if (!user || !profile) return false;
    return profile._id === user._id || profile._id === user.id;
  };

  // Функция для проверки авторизации
  const checkAuth = async () => {
    const accessToken = tokenManager.getAccessToken();
    const storedUser = tokenManager.getUser();

    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      navigate('/');
      return;
    }

    if (storedUser) {
      console.log('User loaded from localStorage:', storedUser);
      setUser(storedUser);
      return;
    }

    try {
      console.log('Checking auth with server...');
      const res = await apiClient.get('/me');
      console.log('Auth check response:', res.data);
      
      if (res.data.user) {
        setUser(res.data.user);
        tokenManager.setUser(res.data.user);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        tokenManager.clearTokens();
        navigate('/');
      }
    }
  };

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    checkAuth();
  }, [navigate]);

  // Получаем посты при загрузке пользователя
  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  // Функция загрузки постов
  const loadPosts = async (pageNum = 1, append = false) => {
    if (loading) return;
    
    setLoading(true);
    console.log('Loading posts, page:', pageNum);
    
    try {
      const res = await apiClient.get('/posts', {
        params: {
          page: pageNum,
          limit: 10
        }
      });
      
      console.log('Posts API response:', res.data);
      
      // Проверяем формат ответа
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
      const res = await apiClient.get(`/posts/${postId}/comments`);
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
      // Отправляем запрос на logout (опционально)
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.log('Logout request failed, but continuing...');
    } finally {
      // Очищаем токены и редиректим
      tokenManager.clearTokens();
      navigate('/');
    }
  };

  const handleCreatePost = async () => {
    if (postText.trim()) {
      try {
        const res = await apiClient.post('/posts', { content: postText });
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
      const res = await apiClient.post(`/posts/${postId}/like`);
      
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
      const res = await apiClient.post(`/posts/${postId}/repost`);
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
        const res = await apiClient.get(`/users/search?query=${query}`);
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
      const res = await apiClient.get(`/users/${userId}`);
      console.log('Profile response:', res.data);
      setProfile(res.data);
      
      setFollowers(res.data.followersCount || 0);
      setFollowing(res.data.followingCount || 0);
      
      const postsRes = await apiClient.get(`/users/${userId}/posts`);
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
      const res = await apiClient.post(`/follow/${userId}`);
      if (userId === profile._id) {
        loadUserProfile(profile._id);
      }
    } catch (err) {
      console.error('Ошибка подписки/отписки:', err);
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;
    
    try {
      const res = await apiClient.post(`/posts/${postId}/comment`, { content: commentText });
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

  // Защита от неавторизованного доступа
  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Flame size={32} />
          <p>Загрузка...</p>
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
            <span>Привет, {user?.username}!</span>
            
            {/* Красивая кнопка переключения темы */}
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
          {suggestions.length > 0 ? (
            suggestions.map(u => (
              <div key={u._id} className="user-suggestion">
                <div className="suggestion-info">
                  <span>@{u.username}</span>
                  <button onClick={() => toggleFollow(u._id)}>Подписаться</button>
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