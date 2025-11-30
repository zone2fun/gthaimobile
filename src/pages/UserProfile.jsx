import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser, toggleFavorite, blockUser, unblockUser, getMe, createReport, checkAlbumAccess, requestAlbumAccess } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import VerifiedAvatar from '../components/VerifiedAvatar';

const UserProfile = ({ userId }) => {
    const { t } = useTranslation();
    const { id } = useParams();
    const targetId = userId || id;
    const navigate = useNavigate();
    const { token, user: currentUser, setUser: setCurrentUser } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxSource, setLightboxSource] = useState('public');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportAdditionalInfo, setReportAdditionalInfo] = useState('');
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const [albumAccess, setAlbumAccess] = useState({ hasAccess: false, isOwner: false, hasPendingRequest: false });
    const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
    const [showPhotoNotification, setShowPhotoNotification] = useState(false);
    const [photoNotificationData, setPhotoNotificationData] = useState({ type: '', message: '' });
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (targetId) {
                try {
                    const promises = [getUser(targetId, token)];
                    if (token) {
                        promises.push(getMe(token));
                        promises.push(checkAlbumAccess(targetId, token));
                    }

                    const results = await Promise.all(promises);
                    const userData = results[0];
                    setUser(userData);

                    if (token) {
                        const currentUserData = results[1];
                        const accessData = results[2];
                        setAlbumAccess(accessData);

                        // Check if this user is in current user's favorites
                        if (currentUserData && currentUserData.favorites && currentUserData.favorites.includes(targetId)) {
                            setIsFavorite(true);
                        }
                        // Check if this user is blocked
                        if (currentUserData && currentUserData.blockedUsers && currentUserData.blockedUsers.includes(targetId)) {
                            setIsBlocked(true);
                        }
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

            const handleAlbumAccessResponse = (request) => {
                const requestOwnerId = request.owner._id || request.owner;
                const currentProfileId = user._id || user.id;

                // Check if the response is for the current profile being viewed
                if (requestOwnerId === currentProfileId) {
                    if (request.status === 'approved') {
                        setAlbumAccess(prev => ({ ...prev, hasAccess: true, hasPendingRequest: false }));
                    } else if (request.status === 'rejected') {
                        setAlbumAccess(prev => ({ ...prev, hasAccess: false, hasPendingRequest: false }));
                    }
                }
            };

            const handlePhotoApproved = (data) => {
                console.log('✅ Photo approved event received:', data);

                // Refresh user data to get updated photos
                if (currentUser && (user._id === currentUser._id || user.id === currentUser._id)) {
                    getUser(targetId, token).then(userData => {
                        setUser(userData);

                        // Also update global user state if it's an avatar
                        if (data.photoType === 'Avatar' || data.photoType === 'avatar' || data.isAvatar) {
                            setCurrentUser(prev => ({ ...prev, img: data.photoUrl }));
                        }
                    });
                }
            };

            socket.on('user_status', handleUserStatus);
            socket.on('album_access_response', handleAlbumAccessResponse);
            socket.on('photo approved', handlePhotoApproved);

            return () => {
                socket.off('user_status', handleUserStatus);
                socket.off('album_access_response', handleAlbumAccessResponse);
                socket.off('photo approved', handlePhotoApproved);
            };
        }
    }, [socket, user, targetId, token]);

    const handleFavorite = async () => {
        if (!token) return navigate('/login');
        try {
            await toggleFavorite(user._id || user.id, token);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const handleBlock = async () => {
        if (!token) return navigate('/login');
        if (window.confirm(`Are you sure you want to block ${user.name}?`)) {
            try {
                await blockUser(user._id || user.id, token);
                setIsBlocked(true);
                alert("User blocked");
            } catch (error) {
                console.error("Error blocking user:", error);
            }
        }
    };

    const handleUnblock = async () => {
        if (!token) return navigate('/login');
        try {
            await unblockUser(user._id || user.id, token);
            setIsBlocked(false);
            alert("User unblocked");
        } catch (error) {
            console.error("Error unblocking user:", error);
        }
    };

    const handleReport = () => {
        if (!token) return navigate('/login');
        setShowReportModal(true);
    };

    const submitReport = async () => {
        if (!reportReason) {
            alert('Please select a reason');
            return;
        }

        try {
            await createReport({
                targetId: user._id || user.id,
                reason: reportReason,
                additionalInfo: reportAdditionalInfo
            }, token);
            setShowReportModal(false);
            setShowReportSuccessModal(true);
            setReportReason('');
            setReportAdditionalInfo('');
        } catch (error) {
            console.error('Error reporting user:', error);
            alert('Failed to submit report');
        }
    };

    const handleRequestAccess = async () => {
        if (!token) return navigate('/login');
        try {
            await requestAlbumAccess(user._id || user.id, token);
            setAlbumAccess(prev => ({ ...prev, hasPendingRequest: true }));
            setShowAccessRequestModal(true);
        } catch (error) {
            console.error('Error requesting access:', error);
            alert('Failed to request access');
        }
    };

    const openLightbox = (index, source = 'public') => {
        setCurrentImageIndex(index);
        setLightboxSource(source);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = (e) => {
        e.stopPropagation();
        const gallery = lightboxSource === 'private' ? user.privateAlbum : user.gallery;
        setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        const gallery = lightboxSource === 'private' ? user.privateAlbum : user.gallery;
        setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${user.name}'s profile on GTHAI`,
                    text: `I found this profile on GTHAI: ${user.name}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            setShowShareModal(true);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
        setShowShareModal(false);
    };

    const shareToLine = () => {
        const url = window.location.href;
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
        setShowShareModal(false);
    };

    const shareToMessenger = () => {
        const url = window.location.href;
        window.location.href = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
        setShowShareModal(false);
    };

    if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;
    if (!user) return <div className="error-message">User not found</div>;

    return (
        <div className="user-profile-page">
            <div className="profile-cover">
                <img src={user.cover || 'https://via.placeholder.com/600x200'} alt="Cover" />
                <div className="profile-cover-overlay"></div>
                {currentUser && (user._id === currentUser._id || user.id === currentUser._id) && user.pendingCover && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(255, 193, 7, 0.9)',
                        color: '#000',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 2
                    }}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>hourglass_empty</span>
                        {t('profile.wait')}
                    </div>
                )}
                {!userId && (
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <span className="material-icons">arrow_back</span>
                    </button>
                )}
            </div>

            <div className="profile-content">
                <div className="profile-header">
                    <div className="profile-avatar" style={{ position: 'relative' }}>
                        <VerifiedAvatar
                            src={user.img}
                            alt={user.name}
                            isVerified={user.isVerified}
                            size={100}
                            onClick={() => openLightbox(0, 'avatar')}
                            style={{
                                cursor: 'pointer',
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                border: '2px solid var(--card-bg)'
                            }}
                        />
                        <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
                        {currentUser && (user._id === currentUser._id || user.id === currentUser._id) && user.pendingImg && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(255, 193, 7, 0.9)',
                                color: '#000',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                zIndex: 2
                            }}>
                                <span className="material-icons" style={{ fontSize: '14px' }}>hourglass_empty</span>
                                {t('profile.wait')}
                            </div>
                        )}
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
                            {user.isOnline ? t('home.online') : t('profile.offline')}
                        </span>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-label">{t('profile.age')}</span>
                        <span className="stat-value">{user.age}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('profile.height')}</span>
                        <span className="stat-value">{user.height} cm</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{t('profile.weight')}</span>
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
                        <span>{t('profile.lookingFor')} {user.lookingFor ? user.lookingFor.join(', ') : ''}</span>
                    </div>
                </div>

                {user.bio && (
                    <div className="profile-bio">
                        <h3 className="section-title" style={{ marginLeft: 0, fontSize: '16px', marginBottom: '10px' }}>{t('profile.aboutMe')}</h3>
                        <p style={{ color: 'var(--secondary-text)', lineHeight: '1.6' }}>{user.bio}</p>
                    </div>
                )}

                <div className="profile-actions">
                    {currentUser && (user._id === currentUser._id || user.id === currentUser._id) ? (
                        <button className="action-btn edit" style={{ width: '100%', backgroundColor: '#333' }} onClick={() => navigate('/edit-profile')}>
                            <span className="material-icons">edit</span>
                            {t('profile.editProfile')}
                        </button>
                    ) : (
                        <>
                            {user.isPublic && (
                                <button className="action-btn" onClick={handleShare} style={{ backgroundColor: '#00C300', flex: 1 }}>
                                    <span className="material-icons">share</span>
                                    {t('profile.share')}
                                </button>
                            )}
                            <button className="action-btn chat" onClick={() => token ? navigate(`/chat/${user._id || user.id}`) : navigate('/login')}>
                                <span className="material-icons">chat_bubble</span>
                                {t('nav.chat')}
                            </button>
                            <button className={`action-btn favorite ${isFavorite ? 'active' : ''}`} onClick={handleFavorite}>
                                <span className="material-icons">{isFavorite ? 'star' : 'star_border'}</span>
                                {isFavorite ? t('profile.favorited') : t('profile.favorite')}
                            </button>
                            <button className="action-btn block" onClick={isBlocked ? handleUnblock : handleBlock} style={isBlocked ? { backgroundColor: '#a607d6' } : {}}>
                                <span className="material-icons">{isBlocked ? 'check_circle' : 'block'}</span>
                                {isBlocked ? t('profile.unblock') : t('profile.block')}
                            </button>
                            <button className="action-btn" onClick={handleReport} style={{ backgroundColor: '#ff4444' }}>
                                <span className="material-icons">flag</span>
                                {t('profile.report')}
                            </button>
                        </>
                    )}
                </div>

                {user.gallery && user.gallery.length > 0 && (
                    <div className="gallery-section">
                        <h3 className="section-title" style={{ marginTop: '20px', marginLeft: 0 }}>{t('profile.photos')}</h3>
                        <div className="gallery-grid">
                            {user.gallery.map((img, index) => (
                                <div key={index} className="gallery-item" onClick={() => openLightbox(index, 'public')}>
                                    <img src={img} alt={`Gallery ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pending Gallery Photos - Only visible to profile owner */}
                {currentUser && (user._id === currentUser._id || user.id === currentUser._id) && user.pendingGallery && user.pendingGallery.length > 0 && (
                    <div className="gallery-section">
                        <h3 className="section-title" style={{ marginTop: '20px', marginLeft: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '20px', color: '#FFC107' }}>hourglass_empty</span>
                            {t('profile.pendingPhotos')}
                        </h3>
                        <div className="gallery-grid">
                            {user.pendingGallery.map((img, index) => (
                                <div key={index} className="gallery-item" style={{ position: 'relative', opacity: 0.7 }}>
                                    <img src={img} alt={`Pending Gallery ${index + 1}`} />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        pointerEvents: 'none'
                                    }}>
                                        <span className="material-icons" style={{ color: '#FFC107', fontSize: '32px' }}>hourglass_empty</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Private Album Section */}
                <div className="gallery-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>{t('profile.privateAlbum')}</h3>
                        {/* Only show lock icon if not owner and no access */}
                        {(!currentUser || (user._id !== currentUser._id && user.id !== currentUser._id)) && !albumAccess.hasAccess && (
                            <span className="material-icons" style={{ color: '#888' }}>lock</span>
                        )}
                    </div>

                    {/* Logic for displaying private album */}
                    {currentUser && (user._id === currentUser._id || user.id === currentUser._id) ? (
                        // Owner view
                        user.privateAlbum && user.privateAlbum.length > 0 ? (
                            <div className="gallery-grid">
                                {user.privateAlbum.map((img, index) => (
                                    <div key={index} className="gallery-item" onClick={() => openLightbox(index, 'private')}>
                                        <img src={img} alt={`Private ${index + 1}`} />
                                        <div className="private-badge">
                                            <span className="material-icons" style={{ fontSize: '12px' }}>lock</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#1a1a1a', borderRadius: '10px', marginTop: '10px' }}>
                                {t('profile.noPrivatePhotos')}
                            </div>
                        )
                    ) : (
                        // Visitor view
                        albumAccess.hasAccess ? (
                            // Has access
                            user.privateAlbum && user.privateAlbum.length > 0 ? (
                                <div className="gallery-grid">
                                    {user.privateAlbum.map((img, index) => (
                                        <div key={index} className="gallery-item" onClick={() => openLightbox(index, 'private')}>
                                            <img src={img} alt={`Private ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#1a1a1a', borderRadius: '10px', marginTop: '10px' }}>
                                    {t('profile.noPrivatePhotos')}
                                </div>
                            )
                        ) : (
                            // No access
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '10px',
                                marginTop: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(166, 7, 214, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span className="material-icons" style={{ fontSize: '30px', color: '#a607d6' }}>lock</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{t('profile.privateAlbum')}</h4>
                                    <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>{t('profile.requestAccessDesc')}</p>
                                </div>
                                {albumAccess.hasPendingRequest ? (
                                    <button disabled style={{
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: '#333',
                                        color: '#888',
                                        cursor: 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        <span className="material-icons" style={{ fontSize: '16px' }}>hourglass_empty</span>
                                        {t('profile.requestSent')}
                                    </button>
                                ) : (
                                    <button onClick={handleRequestAccess} style={{
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: '#a607d6',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}>
                                        {t('profile.requestAccess')}
                                    </button>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>
                        <span className="material-icons">close</span>
                    </button>
                    {lightboxSource !== 'avatar' && (
                        <button className="lightbox-nav prev" onClick={prevImage}>
                            <span className="material-icons">chevron_left</span>
                        </button>
                    )}
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={
                                lightboxSource === 'avatar' ? user.img :
                                    lightboxSource === 'private' ? user.privateAlbum[currentImageIndex] :
                                        user.gallery[currentImageIndex]
                            }
                            alt="Full screen"
                        />
                    </div>
                    {lightboxSource !== 'avatar' && (
                        <button className="lightbox-nav next" onClick={nextImage}>
                            <span className="material-icons">chevron_right</span>
                        </button>
                    )}
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
                            <h3 style={{ margin: 0, fontSize: '20px' }}>{t('profile.report')}</h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>
                            Please select a reason for reporting this user.
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            {['spam', 'inappropriate', 'harassment', 'impersonation', 'scam'].map((reason) => (
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
                                Additional Info (Optional)
                            </label>
                            <textarea
                                value={reportAdditionalInfo}
                                onChange={(e) => setReportAdditionalInfo(e.target.value)}
                                placeholder="Describe the issue..."
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
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={submitReport}
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
                                {t('profile.report')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Success Modal */}
            {showReportSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setShowReportSuccessModal(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <span className="material-icons" style={{ fontSize: '30px', color: '#4CAF50' }}>check_circle</span>
                        </div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Report Submitted</h3>
                        <p style={{ color: '#888', marginBottom: '20px' }}>Thank you for helping keep our community safe. We will review your report shortly.</p>
                        <button onClick={() => setShowReportSuccessModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer' }}>{t('common.close')}</button>
                    </div>
                </div>
            )}

            {/* Access Request Success Modal */}
            {showAccessRequestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease-in' }} onClick={() => setShowAccessRequestModal(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '40px 30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(166, 7, 214, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'scaleIn 0.4s ease-out' }}>
                            <span className="material-icons" style={{ fontSize: '40px', color: '#a607d6' }}>send</span>
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600' }}>{t('profile.requestSent')}</h3>
                        <p style={{ color: '#888', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
                            We have notified the profile owner.<br />
                            Please wait for approval to view the private album.
                        </p>
                        <button onClick={() => setShowAccessRequestModal(false)} style={{ width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(166, 7, 214, 0.3)' }}>{t('common.confirm')}</button>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setShowShareModal(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '30px', maxWidth: '350px', width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px 0' }}>{t('profile.share')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button onClick={shareToLine} style={{
                                padding: '12px', borderRadius: '10px', border: 'none',
                                backgroundColor: '#00C300', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                fontSize: '16px', fontWeight: 'bold'
                            }}>
                                <span className="material-icons">chat</span>
                                Share to Line
                            </button>
                            <button onClick={shareToMessenger} style={{
                                padding: '12px', borderRadius: '10px', border: 'none',
                                backgroundColor: '#0084FF', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                fontSize: '16px', fontWeight: 'bold'
                            }}>
                                <span className="material-icons">message</span>
                                Share to Messenger
                            </button>
                            <button onClick={copyToClipboard} style={{
                                padding: '12px', borderRadius: '10px', border: '1px solid #444',
                                backgroundColor: '#333', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                fontSize: '16px'
                            }}>
                                <span className="material-icons">content_copy</span>
                                Copy Link
                            </button>
                        </div>
                        <button onClick={() => setShowShareModal(false)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>{t('common.cancel')}</button>
                    </div>
                </div>
            )}

            {/* Photo Notification Modal */}
            {showPhotoNotification && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease-in' }} onClick={() => setShowPhotoNotification(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '40px 30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: photoNotificationData.type === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            animation: 'scaleIn 0.4s ease-out'
                        }}>
                            <span className="material-icons" style={{
                                fontSize: '48px',
                                color: photoNotificationData.type === 'approved' ? '#4CAF50' : '#F44336'
                            }}>
                                {photoNotificationData.type === 'approved' ? 'check_circle' : 'cancel'}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600' }}>
                            {photoNotificationData.type === 'approved' ? 'Photo Approved!' : 'Photo Denied'}
                        </h3>
                        <p style={{ color: '#888', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
                            {photoNotificationData.message}
                        </p>
                        <button
                            onClick={() => setShowPhotoNotification(false)}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: photoNotificationData.type === 'approved' ? '#4CAF50' : '#F44336',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '16px',
                                transition: 'all 0.2s',
                                boxShadow: photoNotificationData.type === 'approved' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : '0 4px 12px rgba(244, 67, 54, 0.3)'
                            }}
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
