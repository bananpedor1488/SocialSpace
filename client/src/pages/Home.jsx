import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import PostsList from '../components/PostsList';

const Home = () => {
  const { user } = useAuth();
  const { on, off } = useSocket(user);
  
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Загрузка постов
  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  // Socket.IO обработчики для постов
  useEffect(() => {
    if (!user) return;

    // Новый пост
    const handleNewPost = (newPost) => {
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
    };

    // Новый репост
    const handleNewRepost = (repostData) => {
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
    };

    // Обновление лайка
    const handleLikeUpdate = ({ postId, liked, likesCount, userId: likerUserId }) => {
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
    };

    // Удаление поста
    const handlePostDeleted = ({ postId }) => {
      console.log('Post deleted:', postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
    };

    // Подписка на события
    on('newPost', handleNewPost);
    on('newRepost', handleNewRepost);
    on('likeUpdate', handleLikeUpdate);
    on('postDeleted', handlePostDeleted);

    return () => {
      off('newPost', handleNewPost);
      off('newRepost', handleNewRepost);
      off('likeUpdate', handleLikeUpdate);
      off('postDeleted', handlePostDeleted);
    };
  }, [user, on, off]);

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
        
        return {
          _id: post._id,
          userId: post.author?._id || post.userId || post.author,
          username: username,
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

  return (
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
        <PostsList posts={posts} user={user} />
        
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
  );
};

export default Home;