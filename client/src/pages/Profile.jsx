import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { 
  Users, UserCheck, MessageCircle, Pencil 
} from 'lucide-react';
import PostsList from '../components/PostsList';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useSocket(user);
  
  const [profile, setProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);

  // Определяем ID пользователя для загрузки
  const targetUserId = userId || (user?._id || user?.id);

  // Загружаем профиль при изменении userId или user
  useEffect(() => {
    if (targetUserId) {
      loadUserProfile(targetUserId);
    }
  }, [targetUserId]);

  // Socket.IO обработчики для профиля
  useEffect(() => {
    if (!user || !profile) return;

    // Обновление подписок
    const handleFollowUpdate = ({ targetUserId, followerId, followerUsername, isFollowing, followersCount }) => {
      console.log('Follow update received:', { targetUserId, followerId, followerUsername, isFollowing, followersCount });
      
      if (profile && profile._id === targetUserId) {
        setFollowers(followersCount);
        setProfile(prev => ({
          ...prev,
          followed: followerId === (user._id || user.id) ? isFollowing : prev.followed
        }));
      }
    };

    const handleFollowingUpdate = ({ userId, followingCount }) => {
      console.log('Following update received:', { userId, followingCount });
      
      if (profile && profile._id === userId && isOwnProfile()) {
        setFollowing(followingCount);
      }
    };

    // Обновление лайка для постов профиля
    const handleLikeUpdate = ({ postId, liked, likesCount, userId: likerUserId }) => {
      const isMyLike = likerUserId === (user._id || user.id);
      
      setProfilePosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: likesCount,
              liked: isMyLike ? liked : post.liked
            } 
          : post
      ));
    };

    // Удаление поста
    const handlePostDeleted = ({ postId }) => {
      setProfilePosts(prev => prev.filter(post => post._id !== postId));
    };

    // Подписка на события
    on('followUpdate', handleFollowUpdate);
    on('followingUpdate', handleFollowingUpdate);
    on('likeUpdate', handleLikeUpdate);
    on('postDeleted', handlePostDeleted);

    return () => {
      off('followUpdate', handleFollowUpdate);
      off('followingUpdate', handleFollowingUpdate);
      off('likeUpdate', handleLikeUpdate);
      off('postDeleted', handlePostDeleted);
    };
  }, [user, profile, on, off]);

  // Проверяем, является ли профиль собственным
  const isOwnProfile = () => {
    if (!user || !profile) return false;
    return profile._id === (user._id || user.id);
  };

  const loadUserProfile = async (userId) => {
    console.log('Loading profile for userId:', userId);
    
    if (!userId) {
      console.error('userId is undefined or null');
      return;
    }
    
    setLoading(true);
    
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
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      await axios.post(`https://server-u9ji.onrender.com/api/follow/${userId}`);
    } catch (err) {
      console.error('Ошибка подписки/отписки:', err);
    }
  };

  const startChat = async (userId) => {
    try {
      const res = await axios.post('https://server-u9ji.onrender.com/api/messages/chats', {
        participantId: userId
      });
      navigate('/messages');
    } catch (err) {
      console.error('Ошибка создания чата:', err);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h3>Профиль не найден</h3>
        <p>Пользователь не существует или произошла ошибка при загрузке.</p>
        <button onClick={() => navigate('/home')} className="back-btn">
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
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
                  <button 
                    onClick={() => startChat(profile._id)}
                    className="message-profile-btn"
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
          <PostsList posts={profilePosts} user={user} />
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
  );
};

export default Profile;