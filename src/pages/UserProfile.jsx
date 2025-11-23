import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllUsers } from '../data/users';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const users = getAllUsers();
    const user = users.find(u => u.id === parseInt(id));

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!user) {
        return <div className="app-content" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>User not found</div>;
    }

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

    return (
        <div className="user-profile-page">
            <div className="profile-cover">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <img src={user.cover} alt="Cover" />
            </div>

            <div className="profile-content">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <img src={user.img} alt={user.name} />
                        <div className={`status-dot ${user.online ? 'online' : ''}`}></div>
                    </div>
                    <div className="profile-title">
                        <h1>{user.name}</h1>
                        <span className="online-status">{user.online ? 'Online' : 'Offline'}</span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-label">อายุ</span>
                        <span className="stat-value">{user.age}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">ส่วนสูง</span>
                        <span className="stat-value">{user.height} cm</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">น้ำหนัก</span>
                        <span className="stat-value">{user.weight} kg</span>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="detail-row">
                        <span className="material-icons">public</span>
                        <span>มาจาก: {user.country}</span>
                    </div>
                    <div className="detail-row">
                        <span className="material-icons">search</span>
                        <span>มองหา: {user.lookingFor.join(', ')}</span>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="action-btn chat" onClick={() => navigate(`/chat/${user.id}`)}>
                        <span className="material-icons">chat_bubble</span>
                        แชท
                    </button>
                    <button className="action-btn favorite">
                        <span className="material-icons">{user.starred ? 'star' : 'star_border'}</span>
                        Favorite
                    </button>
                    <button className="action-btn block">
                        <span className="material-icons">block</span>
                        Block
                    </button>
                </div>

                {user.gallery && user.gallery.length > 0 && (
                    <div className="gallery-section">
                        <h3 className="section-title" style={{ marginLeft: 0, marginTop: '20px' }}>รูปภาพ</h3>
                        <div className="gallery-grid">
                            {user.gallery.map((img, index) => (
                                <div key={index} className="gallery-item" onClick={() => openLightbox(index)}>
                                    <img src={img} alt={`Gallery ${index}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {lightboxOpen && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content">
                        <button className="lightbox-nav prev" onClick={prevImage}>
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <img src={user.gallery[currentImageIndex]} alt="Full size" />
                        <button className="lightbox-nav next" onClick={nextImage}>
                            <span className="material-icons">chevron_right</span>
                        </button>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
