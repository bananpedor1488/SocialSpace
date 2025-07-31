import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, MessageSquare, Repeat, MessageCircle, 
  Send, X 
} from 'lucide-react';
import axios from 'axios';

const PostsList = ({ posts, user }) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});

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
    } catch (err) {
      console.error('Ошибка репоста:', err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
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

  if (!posts || posts.length === 0) {
    return <div className="no-posts">Постов пока нет</div>;
  }

  return (
    <>
      {posts.map(post => {
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
              <div className="post-user-info">
                <div className="user-details">
                  <span 
                    className="username clickable"
                    onClick={() => navigate(`/profile/${post.isRepost ? post.originalPost?.author?._id : post.userId}`)}
                  >
                    @{post.isRepost ? post.originalPost?.author?.username || 'Unknown' : post.username || 'Unknown'}
                  </span>
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
                </div>
              </div>
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
                      <div className="comment-header">
                        <div className="comment-info">
                          <span 
                            className="comment-username clickable"
                            onClick={() => navigate(`/profile/${comment.author?._id}`)}
                          >
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
      })}
    </>
  );
};

export default PostsList;