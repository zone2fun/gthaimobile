import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, toggleFavorite, blockUser, unblockUser, getMe } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';

const UserProfile = ({ userId }) => {
    const { id } = useParams();
    const targetId = userId || id;
    const navigate = useNavigate();
    const { token, user: currentUser } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (token && targetId) {
                try {
                    const [userData, currentUserData] = await Promise.all([
                        getUser(targetId, token),
                        getMe(token)
                    ]);

                    setUser(userData);

                    // Check if this user is in current user's favorites
                    if (currentUserData && currentUserData.favorites && currentUserData.favorites.includes(targetId)) {
                        setIsFavorite(true);
                    }
                    // Check if this user is blocked
                    if (currentUserData && currentUserData.blockedUsers && currentUserData.blockedUsers.includes(targetId)) {
                        setIsBlocked(true);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [targetId, token]);

    // Listen for real-time status updates
    useEffect(() => {
        if (socket && user) {
            const handleUserStatus = ({ userId, isOnline }) => {
                if (userId === (user._id || user.id)) {
                    setUser(prev => ({ ...prev, isOnline }));
                }
            };

            socket.on('user status', handleUserStatus);

            return () => {
                socket.off('user status', handleUserStatus);
            };
        }
    }, [socket, user]);

    const handleFavorite = async () => {
        try {
            const res = await toggleFavorite(user._id || user.id, token);
            setIsFavorite(res.isFavorite);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const handleBlock = async () => {
        try {
            await blockUser(user._id || user.id, token);
            setIsBlocked(true);
            navigate('/'); // Go back home
        } catch (error) {
            console.error("Error blocking user:", error);
        }
    };

    const handleUnblock = async () => {
        try {
            await unblockUser(user._id || user.id, token);
            setIsBlocked(false);
        } catch (error) {
            console.error("Error unblocking user:", error);
        }
    };

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % user.gallery.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + user.gallery.length) % user.gallery.length);
    };

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    if (!user) {
        return <div className="app-content" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>User not found</div>;
    }

    return (
        <div className="user-profile-page">
            <div className="profile-cover">
                <img src={user.cover} alt="Cover" />
                <div className="profile-cover-overlay"></div>
                {!userId && (
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <span className="material-icons">arrow_back</span>
                    </button>
                )}
            </div>

            <div className="profile-content">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <img src={user.img} alt={user.name} />
                        <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    <div className="profile-title">
                        <h1>{user.name}</h1>
                        <span
                            className="online-status"
                            style={{
                                color: user.isOnline ? 'var(--online-color)' : 'var(--offline-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: user.isOnline ? 'var(--online-color)' : 'var(--offline-color)',
                                    display: 'inline-block'
                                }}
                            ></span>
                            {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-label">AGE</span>
                        <span className="stat-value">{user.age}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">HEIGHT</span>
                        <span className="stat-value">{user.height} cm</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">WEIGHT</span>
                        <span className="stat-value">{user.weight} kg</span>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="detail-row">
                        <span className="material-icons">location_on</span>
                        <span>{user.country}</span>
                    </div>
                    <div className="detail-row">
                        <span className="material-icons">search</span>
                        <span>Looking for: {user.lookingFor ? user.lookingFor.join(', ') : ''}</span>
                    </div>
                </div>

                {user.bio && (
                    <div className="profile-bio">
                        <h3 className="section-title" style={{ marginLeft: 0, fontSize: '16px', marginBottom: '10px' }}>About Me</h3>
                        <p style={{ color: 'var(--secondary-text)', lineHeight: '1.6' }}>{user.bio}</p>
                    </div>
                )}

                <div className="profile-actions">
                    {currentUser && (user._id === currentUser._id || user.id === currentUser._id) ? (
                        <button className="action-btn edit" style={{ width: '100%', backgroundColor: '#333' }} onClick={() => navigate('/edit-profile')}>
                            <span className="material-icons">edit</span>
                            Edit My Profile
                        </button>
                    ) : (
                        <>
                            <button className="action-btn chat" onClick={() => navigate(`/chat/${user._id || user.id}`)}>
                                <span className="material-icons">chat_bubble</span>
                                Chat
                            </button>
                            <button className={`action-btn favorite ${isFavorite ? 'active' : ''}`} onClick={handleFavorite}>
                                <span className="material-icons">{isFavorite ? 'star' : 'star_border'}</span>
                                {isFavorite ? 'Favorited' : 'Favorite'}
                            </button>
                            <button className="action-btn block" onClick={isBlocked ? handleUnblock : handleBlock} style={isBlocked ? { backgroundColor: '#a607d6' } : {}}>
                                <span className="material-icons">{isBlocked ? 'check_circle' : 'block'}</span>
                                {isBlocked ? 'Unblock' : 'Block'}
                            </button>
                        </>
                    )}
                </div>

                {user.gallery && user.gallery.length > 0 && (
                    <div className="gallery-section">
                        <h3 className="section-title" style={{ marginTop: '20px', marginLeft: 0 }}>Photos</h3>
                        <div className="gallery-grid">
                            {user.gallery.map((img, index) => (
                                <div key={index} className="gallery-item" onClick={() => openLightbox(index)}>
                                    <img src={img} alt={`Gallery ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {lightboxOpen && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>
                        <span className="material-icons">close</span>
                    </button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-nav prev" onClick={prevImage}>
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <img src={user.gallery[currentImageIndex]} alt="Full size" />
                        <button className="lightbox-nav next" onClick={nextImage}>
                            <span className="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
