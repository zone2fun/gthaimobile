import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (token && id) {
                try {
                    const userData = await getUser(id, token);
                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching user:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [id, token]);

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
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span className="material-icons">arrow_back</span>
                </button>
            </div>

            <div className="profile-content">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <img src={user.img} alt={user.name} />
                        <div className={`status-dot ${user.isOnline ? 'online' : ''}`}></div>
                    </div>
                    <div className="profile-title">
                        <h1>{user.name}</h1>
                        <span className="online-status">{user.isOnline ? 'Online' : 'Offline'}</span>
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

                <div className="profile-actions">
                    {currentUser && (user._id === currentUser._id || user.id === currentUser._id) ? (
                        <button className="action-btn edit" style={{ width: '100%', backgroundColor: '#333' }}>
                            <span className="material-icons">edit</span>
                            Edit My Profile
                        </button>
                    ) : (
                        <>
                            <button className="action-btn chat" onClick={() => navigate(`/chat/${user._id || user.id}`)}>
                                <span className="material-icons">chat_bubble</span>
                                Chat
                            </button>
                            <button className="action-btn favorite">
                                <span className="material-icons">star_border</span>
                                Favorite
                            </button>
                            <button className="action-btn block">
                                <span className="material-icons">block</span>
                                Block
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
