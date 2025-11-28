import React, { useState, useEffect, useContext, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getPosts, createPost, likePost, deletePost, addComment, deleteComment, createReport } from '../services/api';
import SocketContext from '../context/SocketContext';
import SkeletonPost from '../components/SkeletonPost';

const Special = () => {
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [selectedPostLikes, setSelectedPostLikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [postToReport, setPostToReport] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportAdditionalInfo, setReportAdditionalInfo] = useState('');
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const { token, user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const hashtag = searchParams.get('hashtag');

    useEffect(() => {
        fetchPosts();
    }, [token, hashtag]);

    // Listen for photo approval to update avatars in real-time
    useEffect(() => {
        if (socket) {
            const handlePhotoApproved = (data) => {
                if (data.photoType === 'Avatar' || data.photoType === 'avatar' || data.isAvatar) {
                    setPosts(prevPosts => prevPosts.map(post => {
                        if (post.user._id === data.userId || post.user.id === data.userId) {
                            return {
                                ...post,
                                user: {
                                    ...post.user,
                                    img: data.photoUrl
                                }
                            };
                        }
                        return post;
                    }));
                }
            };

            socket.on('photo approved', handlePhotoApproved);

            return () => {
                socket.off('photo approved', handlePhotoApproved);
            };
        }
    }, [socket]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await getPosts(token, hashtag);
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPostImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !newPostImage) return;

        try {
            setIsPosting(true);
            const formData = new FormData();
            formData.append('content', newPostContent);
            if (newPostImage) {
                formData.append('image', newPostImage);
            }

            const newPost = await createPost(formData, token);
            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setNewPostImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            const updatedLikes = await likePost(postId, token);
            setPosts(posts.map(post =>
                post._id === postId ? { ...post, likes: updatedLikes } : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleDelete = async (postId) => {
        setPostToDelete(postId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (postToDelete) {
            try {
                await deletePost(postToDelete, token);
                setPosts(posts.filter(post => post._id !== postToDelete));
                setShowDeleteModal(false);
                setPostToDelete(null);
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const toggleComments = (postId) => {
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null);
        } else {
            setActiveCommentPostId(postId);
            setCommentText('');
        }
    };

    const handleCommentSubmit = async (postId) => {
        if (!commentText.trim()) return;

        try {
            const updatedComments = await addComment(postId, commentText, token);
            setPosts(posts.map(post =>
                post._id === postId ? { ...post, comments: updatedComments } : post
            ));
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const updatedComments = await deleteComment(postId, commentId, token);
            setPosts(posts.map(post =>
                post._id === postId ? { ...post, comments: updatedComments } : post
            ));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleReport = (postId) => {
        setPostToReport(postId);
        setReportReason('');
        setReportAdditionalInfo('');
        setShowReportModal(true);
    };

    const confirmReport = async () => {
        if (!reportReason) {
            return;
        }

        try {
            await createReport(postToReport, null, reportReason, reportAdditionalInfo, 'post', token);
            setShowReportModal(false);
            setPostToReport(null);
            setReportReason('');
            setReportAdditionalInfo('');
            setShowReportSuccessModal(true);
        } catch (error) {
            console.error('Error reporting post:', error);
            // Keep modal open to show error
        }
    };

    return (
        <div className="app-content" style={{ paddingBottom: '80px' }}>
            <h2 className="section-title">Community Feed</h2>

            {/* Create Post Box */}
            <div className="create-post-card">
                <div className="create-post-header">
                    <img src={user?.img || '/user_avatar.png'} alt="User" className="post-avatar" />
                    <textarea
                        placeholder={`What's on your mind, ${user?.name}?`}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="post-input"
                    />
                </div>
                {imagePreview && (
                    <div className="post-image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button onClick={() => { setNewPostImage(null); setImagePreview(null); }} className="remove-image-btn">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                )}
                <div className="create-post-actions">
                    <div className="action-buttons-left">
                        <button className="action-btn" onClick={() => fileInputRef.current.click()} title="Add Image">
                            <span className="material-icons" style={{ color: '#45bd62' }}>photo_library</span>
                        </button>
                        <button className="action-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
                            <span className="material-icons" style={{ color: '#f7b928' }}>sentiment_satisfied_alt</span>
                        </button>
                        <button className="action-btn" onClick={() => {
                            setNewPostContent(prev => prev + ' 📍 ');
                            document.querySelector('.post-input').focus();
                        }} title="Add Location">
                            <span className="material-icons" style={{ color: '#f5533d' }}>place</span>
                        </button>
                        <button className="action-btn" onClick={() => {
                            setNewPostContent(prev => prev + ' #');
                            document.querySelector('.post-input').focus();
                        }} title="Add Hashtag">
                            <span className="material-icons" style={{ color: '#1da1f2' }}>tag</span>
                        </button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <button
                        className="post-submit-btn"
                        onClick={handleCreatePost}
                        disabled={(!newPostContent.trim() && !newPostImage) || isPosting}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {isPosting ? (
                            <>
                                <span className="material-icons" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>refresh</span>
                                Posting...
                            </>
                        ) : (
                            'Post'
                        )}
                    </button>
                </div>
                {showEmojiPicker && (
                    <>
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 999
                            }}
                            onClick={() => setShowEmojiPicker(false)}
                        />
                        <div className="emoji-picker-container">
                            <EmojiPicker onEmojiClick={(emojiObject) => {
                                setNewPostContent(prev => prev + emojiObject.emoji);
                            }} />
                        </div>
                    </>
                )}
            </div>

            {/* Posts Feed */}
            <div className="posts-feed">
                {/* Search Summary */}
                {hashtag && (
                    <div className="search-summary-card">
                        <span className="material-icons" style={{ color: '#a607d6', marginRight: '8px' }}>search</span>
                        <span style={{ color: '#888', fontSize: '14px' }}>กำลังค้นหา: </span>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginLeft: '5px' }}>
                            {hashtag.split(',').map(tag => `#${tag.trim()}`).join(', ')}
                        </span>
                    </div>
                )}

                {loading ? (
                    <>
                        <SkeletonPost />
                        <SkeletonPost />
                        <SkeletonPost />
                    </>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No posts yet. Be the first to share!</div>
                ) : (
                    posts.map(post => (
                        <div key={post._id} className="post-card">
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
                                    <button className="post-options-btn" onClick={() => handleDelete(post._id)}>
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
                                                {post.likes.slice(0, 10).map((likeUser, index) => (
                                                    <img
                                                        key={likeUser._id || index}
                                                        src={likeUser.img || '/user_avatar.png'}
                                                        alt={likeUser.name}
                                                        title={likeUser.name}
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
                                            {post.likes.length > 10 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPostLikes(post.likes);
                                                        setShowLikesModal(true);
                                                    }}
                                                    style={{
                                                        background: '#a607d6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        padding: '4px 8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        marginLeft: '5px'
                                                    }}
                                                >
                                                    +{post.likes.length - 10}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <span
                                        style={{
                                            fontSize: '14px',
                                            color: '#888',
                                            cursor: post.likes.length > 0 ? 'pointer' : 'default',
                                            marginLeft: '5px'
                                        }}
                                        onClick={() => {
                                            if (post.likes.length > 0) {
                                                setSelectedPostLikes(post.likes);
                                                setShowLikesModal(true);
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            if (post.likes.length > 0) e.target.style.textDecoration = 'underline';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.textDecoration = 'none';
                                        }}
                                    >
                                        {post.likes.length} Likes
                                    </span>
                                </div>
                            </div>

                            <div className="post-actions">
                                <button
                                    className={`post-action-btn ${post.likes.some(like => like._id === user?._id) ? 'active' : ''}`}
                                    onClick={() => handleLike(post._id)}
                                >
                                    <span className="material-icons">{post.likes.some(like => like._id === user?._id) ? 'thumb_up' : 'thumb_up_off_alt'}</span>
                                    Like
                                </button>
                                <button className="post-action-btn" onClick={() => toggleComments(post._id)}>
                                    <span className="material-icons">chat_bubble_outline</span>
                                    Comment ({post.comments?.length || 0})
                                </button>
                                <button className="post-action-btn" onClick={() => handleReport(post._id)} style={{ color: '#ff6b6b' }}>
                                    <span className="material-icons">flag</span>
                                    Report
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeCommentPostId === post._id && (
                                <div className="comments-section" style={{ marginTop: '10px', paddingTop: '10px' }}>
                                    <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
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
                                                            onClick={() => handleDeleteComment(post._id, comment._id)}
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
                                                                transition: 'all 0.2s ease',
                                                                width: '24px',
                                                                height: '24px',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                                                                e.currentTarget.style.color = '#ff4444';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.color = '#888';
                                                            }}
                                                            title="Delete comment"
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
                                    <div className="add-comment-box" style={{ display: 'flex', alignItems: 'center' }}>
                                        <img src={user?.img || '/user_avatar.png'} alt="User" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: '#333', borderRadius: '20px', padding: '5px 10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                                                style={{ flex: 1, background: 'none', border: 'none', color: 'white', padding: '5px', outline: 'none' }}
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(post._id)}
                                                disabled={!commentText.trim()}
                                                style={{ background: 'none', border: 'none', color: '#a607d6', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '20px' }}>send</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Likes Modal */}
            {showLikesModal && (
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
                    onClick={() => setShowLikesModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '15px',
                            padding: '20px',
                            maxWidth: '400px',
                            width: '90%',
                            maxHeight: '70vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Likes ({selectedPostLikes.length})</h3>
                            <button
                                onClick={() => setShowLikesModal(false)}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div>
                            {selectedPostLikes.map((likeUser) => (
                                <div
                                    key={likeUser._id}
                                    onClick={() => {
                                        navigate(`/user/${likeUser._id}`);
                                        setShowLikesModal(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        marginBottom: '5px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <img
                                        src={likeUser.img || '/user_avatar.png'}
                                        alt={likeUser.name}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            marginRight: '12px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <span style={{ fontWeight: '500' }}>{likeUser.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                        <div style={{ marginBottom: '20px' }}>
                            <span className="material-icons" style={{ fontSize: '48px', color: '#ff4444' }}>delete_outline</span>
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Delete Post?</h3>
                        <p style={{ color: '#888', marginBottom: '25px', fontSize: '14px' }}>
                            Are you sure you want to delete this post? This action cannot be undone.
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
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
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
                    onClick={() => setShowReportModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '15px',
                            padding: '30px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px' }}>รายงานโพสต์</h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>
                            กรุณาเลือกเหตุผลที่คุณต้องการรายงานโพสต์นี้
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            {['spam', 'อนาจาร', 'กล่าวร้ายผู้อื่น', 'แอบอ้าง', 'หลอกลวง'].map((reason) => (
                                <div
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    style={{
                                        padding: '15px',
                                        marginBottom: '10px',
                                        borderRadius: '10px',
                                        border: `2px solid ${reportReason === reason ? '#a607d6' : '#333'}`,
                                        backgroundColor: reportReason === reason ? 'rgba(166, 7, 214, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${reportReason === reason ? '#a607d6' : '#666'}`,
                                        backgroundColor: reportReason === reason ? '#a607d6' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {reportReason === reason && (
                                            <span className="material-icons" style={{ fontSize: '14px', color: 'white' }}>check</span>
                                        )}
                                    </div>
                                    <span>{reason}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
                                รายละเอียดเพิ่มเติม (ถ้ามี)
                            </label>
                            <textarea
                                value={reportAdditionalInfo}
                                onChange={(e) => setReportAdditionalInfo(e.target.value)}
                                placeholder="อธิบายเพิ่มเติมเกี่ยวกับปัญหา..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: '#2a2a2a',
                                    color: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmReport}
                                disabled={!reportReason}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: reportReason ? '#ff4444' : '#555',
                                    color: 'white',
                                    cursor: reportReason ? 'pointer' : 'not-allowed',
                                    fontWeight: '500'
                                }}
                            >
                                ส่งรายงาน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Success Modal */}
            {showReportSuccessModal && (
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
                        zIndex: 1001,
                        animation: 'fadeIn 0.2s ease-in'
                    }}
                    onClick={() => setShowReportSuccessModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '20px',
                            padding: '40px 30px',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Success Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            animation: 'scaleIn 0.4s ease-out'
                        }}>
                            <span className="material-icons" style={{
                                fontSize: '48px',
                                color: '#4CAF50'
                            }}>check_circle</span>
                        </div>

                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '24px',
                            fontWeight: '600'
                        }}>ส่งรายงานสำเร็จ</h3>

                        <p style={{
                            color: '#888',
                            marginBottom: '30px',
                            fontSize: '15px',
                            lineHeight: '1.6'
                        }}>
                            ขอบคุณที่แจ้งให้เราทราบ<br />
                            ทีมงานจะตรวจสอบและดำเนินการโดยเร็วที่สุด
                        </p>

                        <button
                            onClick={() => setShowReportSuccessModal(false)}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: '#a607d6',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '16px',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(166, 7, 214, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#8a05b8';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(166, 7, 214, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#a607d6';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(166, 7, 214, 0.3)';
                            }}
                        >
                            เข้าใจแล้ว
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Special;
