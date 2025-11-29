import React, { useState, useEffect } from 'react';

const ApprovePosts = () => {
    const [pendingPosts, setPendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPendingPosts();
    }, []);

    const fetchPendingPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/posts/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingPosts(data);
            } else {
                console.error('Failed to fetch posts:', response.status);
            }
        } catch (error) {
            console.error('Error fetching pending posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (post) => {
        if (processingIds.has(post._id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, post._id]));

            const response = await fetch(`${API_URL}/api/admin/posts/${post._id}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setPendingPosts(prev => prev.filter(p => p._id !== post._id));
            } else {
                alert('Failed to approve post');
            }
        } catch (error) {
            console.error('Error approving post:', error);
            alert('Failed to approve post');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(post._id);
                return newSet;
            });
        }
    };

    const handleDeny = async (post) => {
        if (processingIds.has(post._id)) return;



        try {
            setProcessingIds(prev => new Set([...prev, post._id]));

            const response = await fetch(`${API_URL}/api/admin/posts/${post._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPendingPosts(prev => prev.filter(p => p._id !== post._id));
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(post._id);
                return newSet;
            });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <h1 style={styles.pageTitle}>Post Approval</h1>
                <div style={styles.loading}>Loading pending posts...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Post Approval</h1>
                <button onClick={fetchPendingPosts} style={styles.refreshBtn}>
                    <span className="material-icons">refresh</span>
                    Refresh
                </button>
            </div>
            <p style={styles.subtitle}>Review and approve posts with images</p>

            {pendingPosts.length === 0 ? (
                <div style={styles.noPosts}>
                    <span className="material-icons" style={styles.noPostsIcon}>article</span>
                    <p style={styles.noPostsText}>No pending posts to review</p>
                </div>
            ) : (
                <>
                    <div style={styles.stats}>
                        <span style={styles.pendingCount}>
                            {pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} pending approval
                        </span>
                    </div>
                    <div style={styles.postsGrid}>
                        {pendingPosts.map((post) => (
                            <div
                                key={post._id}
                                className="post-card-wrapper"
                                style={{
                                    ...styles.postCard,
                                    opacity: processingIds.has(post._id) ? 0.6 : 1,
                                    pointerEvents: processingIds.has(post._id) ? 'none' : 'auto'
                                }}
                            >
                                {/* Post Image */}
                                <div style={styles.imageWrapper}>
                                    <img
                                        src={post.image}
                                        alt="Post content"
                                        style={styles.postImage}
                                    />
                                    <div className="post-overlay" style={styles.postOverlay}>
                                        <button
                                            style={styles.approveBtn}
                                            onClick={() => handleApprove(post)}
                                            disabled={processingIds.has(post._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>check</span>
                                            Approve
                                        </button>
                                        <button
                                            style={styles.denyBtn}
                                            onClick={() => handleDeny(post)}
                                            disabled={processingIds.has(post._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Post Info */}
                                <div style={styles.postInfo}>
                                    <div style={styles.userSection}>
                                        <img
                                            src={post.user?.img || '/user_avatar.png'}
                                            alt={post.user?.name}
                                            style={styles.userAvatar}
                                        />
                                        <div style={styles.userInfo}>
                                            <span style={styles.username}>{post.user?.name || 'Unknown User'}</span>
                                            <span style={styles.postDate}>{formatDate(post.createdAt)}</span>
                                        </div>
                                    </div>

                                    {post.content && (
                                        <div style={styles.postContent}>
                                            <p style={styles.contentText}>
                                                {post.content.length > 100
                                                    ? post.content.substring(0, 100) + '...'
                                                    : post.content}
                                            </p>
                                        </div>
                                    )}

                                    <div style={styles.postStats}>
                                        <span style={styles.statItem}>
                                            <span className="material-icons" style={styles.statIcon}>thumb_up</span>
                                            {post.likes?.length || 0}
                                        </span>
                                        <span style={styles.statItem}>
                                            <span className="material-icons" style={styles.statIcon}>comment</span>
                                            {post.comments?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100%',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0,
    },
    refreshBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    subtitle: {
        color: '#a0a0a0',
        marginBottom: '20px',
        fontSize: '14px',
    },
    loading: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#a0a0a0',
        fontSize: '16px',
    },
    noPosts: {
        textAlign: 'center',
        padding: '80px 20px',
        color: '#666',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
    },
    noPostsIcon: {
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.5,
        display: 'block',
    },
    noPostsText: {
        fontSize: '16px',
        margin: 0,
    },
    stats: {
        marginBottom: '20px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #a607d6 0%, #7b00b8 100%)',
        borderRadius: '12px',
        color: 'white',
    },
    pendingCount: {
        fontSize: '16px',
        fontWeight: '600',
    },
    postsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    postCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '75%', // 4:3 aspect ratio
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
    },
    postImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    postOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        padding: '16px',
    },
    approveBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'white',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    denyBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'white',
        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    },
    postInfo: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    userAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #333',
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
    },
    username: {
        fontWeight: '600',
        color: '#fff',
        fontSize: '14px',
    },
    postDate: {
        fontSize: '12px',
        color: '#a0a0a0',
    },
    postContent: {
        paddingTop: '8px',
        borderTop: '1px solid #2a2a2a',
    },
    contentText: {
        color: '#e0e0e0',
        fontSize: '14px',
        lineHeight: '1.5',
        margin: 0,
        wordBreak: 'break-word',
    },
    postStats: {
        display: 'flex',
        gap: '16px',
        paddingTop: '8px',
        borderTop: '1px solid #2a2a2a',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#a0a0a0',
        fontSize: '13px',
    },
    statIcon: {
        fontSize: '16px',
    },
};

// Add hover effect using CSS
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .post-card-wrapper:hover .post-overlay {
            opacity: 1 !important;
        }
        .post-card-wrapper {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .post-card-wrapper:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(166, 7, 214, 0.3);
        }
    `;
    if (!document.getElementById('post-approval-styles')) {
        styleSheet.id = 'post-approval-styles';
        document.head.appendChild(styleSheet);
    }
}

export default ApprovePosts;
