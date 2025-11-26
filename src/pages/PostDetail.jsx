import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getPost, likePost, addComment, deleteComment, deletePost } from '../services/api';
import SkeletonPost from '../components/SkeletonPost';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await getPost(id, token);
                setPost(data);
            } catch (error) {
                console.error('Error fetching post:', error);
            } finally {
                setLoading(false);
            }
        };
        if (token && id) {
            fetchPost();
        }
    }, [id, token]);

    const handleLike = async () => {
        try {
            const updatedLikes = await likePost(post._id, token);
            setPost(prev => ({ ...prev, likes: updatedLikes }));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;

        try {
            const updatedComments = await addComment(post._id, commentText, token);
            setPost(prev => ({ ...prev, comments: updatedComments }));
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const updatedComments = await deleteComment(post._id, commentId, token);
            setPost(prev => ({ ...prev, comments: updatedComments }));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleDeletePost = async () => {
        try {
            await deletePost(post._id, token);
            navigate('/special'); // Go back to feed
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    if (loading) return <div className="app-content"><SkeletonPost /></div>;
    if (!post) return <div className="app-content" style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>Post not found</div>;

    return (
        <div className="app-content" style={{ paddingBottom: '80px' }}>
            <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #333', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Post</h2>
            </div>

            <div className="post-card">
                <div className="post-header">
                    <div className="post-author-info" onClick={() => navigate(`/user/${post.user._id}`)}>
                        <div className="post-avatar-wrapper">
                            <img src={post.user.img} alt={post.user.name} className="post-avatar" />
                            <div className={`status-dot ${post.user.isOnline ? 'online' : 'offline'}`}></div>
                        </div>
                        <div>
                            <div className="post-author-name">{post.user.name}</div>
                            <div className="post-time">
                                {new Date(post.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    {user?._id === post.user._id && (
                        <button className="post-options-btn" onClick={() => setShowDeleteModal(true)}>
                            <span className="material-icons">delete</span>
                        </button>
                    )}
                </div>

                <div className="post-content">
                    {post.content && <p>{post.content}</p>}
                    {post.image && (
                        <div className="post-image-container">
                            <img src={post.image} alt="Post content" />
                        </div>
                    )}
                </div>

                <div className="post-stats">
                    <div className="post-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {post.likes && post.likes.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', marginRight: '5px' }}>
                                    {post.likes.slice(0, 5).map((likeUser, index) => (
                                        <img
                                            key={likeUser._id || index}
                                            src={likeUser.img || '/user_avatar.png'}
                                            alt={likeUser.name}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                border: '2px solid #1a1a1a',
                                                marginLeft: index > 0 ? '-8px' : '0',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <span style={{ fontSize: '14px', color: '#888' }}>{post.likes.length} Likes</span>
                    </div>
                </div>

                <div className="post-actions">
                    <button
                        className={`post-action-btn ${post.likes.some(like => like._id === user?._id) ? 'active' : ''}`}
                        onClick={handleLike}
                    >
                        <span className="material-icons">{post.likes.some(like => like._id === user?._id) ? 'thumb_up' : 'thumb_up_off_alt'}</span>
                        Like
                    </button>
                    <button className="post-action-btn">
                        <span className="material-icons">chat_bubble_outline</span>
                        Comment ({post.comments?.length || 0})
                    </button>
                </div>

                {/* Comments Section - Always visible in detail view */}
                <div className="comments-section" style={{ marginTop: '10px', paddingTop: '10px' }}>
                    <div className="comments-list" style={{ marginBottom: '10px' }}>
                        {post.comments?.map((comment, index) => (
                            <div key={comment._id || index} className="comment-item" style={{ display: 'flex', marginBottom: '10px', alignItems: 'flex-start' }}>
                                <img
                                    src={comment.user?.img || '/user_avatar.png'}
                                    alt={comment.user?.name}
                                    onClick={() => navigate(`/user/${comment.user?._id}`)}
                                    style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <div className="comment-content" style={{ backgroundColor: '#333', padding: '8px 12px', borderRadius: '15px', flex: 1 }}>
                                        <div className="comment-author" style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>
                                            {comment.user?.name || 'Unknown User'}
                                        </div>
                                        <div className="comment-text" style={{ fontSize: '14px' }}>{comment.text}</div>
                                    </div>
                                    {user?._id === post.user._id && (
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#888',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px'
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>delete_outline</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                            <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '10px' }}>No comments yet.</div>
                        )}
                    </div>
                    <div className="add-comment-box" style={{ display: 'flex', alignItems: 'center', position: 'sticky', bottom: '0', backgroundColor: '#1a1a1a', padding: '10px 0' }}>
                        <img src={user?.img || '/user_avatar.png'} alt="User" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: '#333', borderRadius: '20px', padding: '5px 10px' }}>
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                style={{ flex: 1, background: 'none', border: 'none', color: 'white', padding: '5px', outline: 'none' }}
                            />
                            <button
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim()}
                                style={{ background: 'none', border: 'none', color: '#a607d6', cursor: 'pointer', padding: '5px' }}
                            >
                                <span className="material-icons" style={{ fontSize: '20px' }}>send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '15px',
                            padding: '30px',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Delete Post?</h3>
                        <p style={{ color: '#888', marginBottom: '25px', fontSize: '14px' }}>
                            Are you sure you want to delete this post?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePost}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
