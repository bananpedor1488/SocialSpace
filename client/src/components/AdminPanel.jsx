import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Trash2, Ban, BarChart3, Settings, 
  Search, UserCheck, AlertTriangle, Eye, Activity,
  FileText, X, UserX, Crown, Wifi
} from 'lucide-react';
import axios from 'axios';

const AdminPanel = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
    setLoading(false);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
    setLoading(false);
  };

  const toggleUserRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      loadUsers();
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
    }
  };

  const banUser = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/ban`);
      loadUsers();
    } catch (error) {
      console.error('Ошибка бана пользователя:', error);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`/api/admin/posts/${postId}`);
      loadPosts();
    } catch (error) {
      console.error('Ошибка удаления поста:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.author?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'posts', label: 'Посты', icon: Activity },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
  ];

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title">
            <Shield className="admin-panel-icon" size={24} />
            <h2>Панель администратора</h2>
          </div>
          <button className="admin-panel-close" onClick={onClose}>×</button>
        </div>

        <div className="admin-panel-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="admin-panel-content">
          {(activeTab === 'users' || activeTab === 'posts') && (
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder={`Поиск ${activeTab === 'users' ? 'пользователей' : 'постов'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {loading && (
            <div className="admin-loading">Загрузка...</div>
          )}

          {activeTab === 'users' && !loading && (
            <div className="admin-users">
              <div className="admin-users-header">
                <h3>Пользователи ({filteredUsers.length})</h3>
              </div>
              <div className="admin-users-list">
                {filteredUsers.map(u => (
                  <div key={u._id} className="admin-user-item">
                    <div className="admin-user-info">
                      <div className="admin-user-avatar">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} />
                        ) : (
                          <div className="admin-user-avatar-placeholder">
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="admin-user-details">
                        <div className="admin-user-name">
                          {u.displayName || u.username}
                          {u.role === 'admin' && (
                            <span className="admin-badge-small">
                              <Shield className="admin-icon" size={10} />
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="admin-user-username">@{u.username}</div>
                        <div className="admin-user-stats">
                          Постов: {u.postsCount || 0} | Подписчиков: {u.followersCount || 0}
                        </div>
                      </div>
                    </div>
                    <div className="admin-user-actions">
                      <button
                        className={`admin-action-btn ${u.role === 'admin' ? 'demote' : 'promote'}`}
                        onClick={() => toggleUserRole(u._id, u.role)}
                        title={u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                      >
                        <UserCheck size={14} />
                        {u.role === 'admin' ? 'Снять' : 'Админ'}
                      </button>
                      <button
                        className="admin-action-btn ban"
                        onClick={() => banUser(u._id)}
                        title="Забанить пользователя"
                      >
                        <Ban size={14} />
                        Бан
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'posts' && !loading && (
            <div className="admin-posts">
              <div className="admin-posts-header">
                <h3>Посты ({filteredPosts.length})</h3>
              </div>
              <div className="admin-posts-list">
                {filteredPosts.map(post => (
                  <div key={post._id} className="admin-post-item">
                    <div className="admin-post-info">
                      <div className="admin-post-author">
                        @{post.author?.username}
                        {post.author?.role === 'admin' && (
                          <span className="admin-badge-small">
                            <Shield className="admin-icon" size={10} />
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="admin-post-content">
                        {post.content?.substring(0, 200)}
                        {post.content?.length > 200 && '...'}
                      </div>
                      <div className="admin-post-stats">
                        Лайков: {post.likes || 0} | Комментариев: {post.commentsCount || 0}
                      </div>
                    </div>
                    <div className="admin-post-actions">
                      <button
                        className="admin-action-btn delete"
                        onClick={() => deletePost(post._id)}
                        title="Удалить пост"
                      >
                        <Trash2 size={14} />
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && !loading && stats && (
            <div className="admin-stats">
              <div className="admin-stats-cards">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-number">{stats.totalUsers || 0}</div>
                    <div className="admin-stat-label">Пользователей</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Activity size={24} />
                  </div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-number">{stats.totalPosts || 0}</div>
                    <div className="admin-stat-label">Постов</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Shield size={24} />
                  </div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-number">{stats.totalAdmins || 0}</div>
                    <div className="admin-stat-label">Админов</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Eye size={24} />
                  </div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-number">{stats.onlineUsers || 0}</div>
                    <div className="admin-stat-label">Онлайн</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
