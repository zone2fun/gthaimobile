import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, toggleFavorite, blockUser, unblockUser, getMe, createReport, checkAlbumAccess, requestAlbumAccess } from '../services/api';
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportAdditionalInfo, setReportAdditionalInfo] = useState('');
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
    const [albumAccess, setAlbumAccess] = useState({ hasAccess: false, isOwner: false, hasPendingRequest: false });
    const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (token && targetId) {
                try {
                    const [userData, currentUserData, accessData] = await Promise.all([
                        getUser(targetId, token),
                        getMe(token),
                        checkAlbumAccess(targetId, token)
                    ]);

                    setUser(userData);
                    setAlbumAccess(accessData);

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

            socket.on('user status', handleUserStatus);
            socket.on('album access response', handleAlbumAccessResponse);

            return () => {
                socket.off('user status', handleUserStatus);
                socket.off('album access response', handleAlbumAccessResponse);
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

    const handleReport = () => {
        setReportReason('');
        setReportAdditionalInfo('');
        setShowReportModal(true);
    };

    const confirmReport = async () => {
        if (!reportReason) {
            return;
        }

        try {
            await createReport(null, user._id || user.id, reportReason, reportAdditionalInfo, 'user', token);
            setShowReportModal(false);
            setReportReason('');
            setReportAdditionalInfo('');
            setShowReportSuccessModal(true);
        } catch (error) {
            console.error('Error reporting user:', error);
        }
    };

    const handleRequestAccess = async () => {
        try {
            await requestAlbumAccess(user._id || user.id, token);
            setAlbumAccess(prev => ({ ...prev, hasPendingRequest: true }));
            setShowAccessRequestModal(true);
        } catch (error) {
            console.error('Error requesting album access:', error);
            // Could add an error modal here if needed, but for now just log it
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
                            <button className="action-btn" onClick={handleReport} style={{ backgroundColor: '#ff4444' }}>
                                <span className="material-icons">flag</span>
                                Report
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

                {/* Private Album Section */}
                {user.privateAlbum && user.privateAlbum.length > 0 && (
                    <div className="gallery-section">
                        <h3 className="section-title" style={{ marginTop: '20px', marginLeft: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>lock</span>
                            Private Album
                        </h3>

                        {albumAccess.hasAccess ? (
                            <div className="gallery-grid">
                                {user.privateAlbum.map((img, index) => (
                                    <div key={index} className="gallery-item" onClick={() => {
                                        // Handle private album lightbox (need to adjust existing lightbox logic or add new one)
                                        // For simplicity, reusing openLightbox but need to handle index offset if mixing with public gallery
                                        // Or create a separate lightbox state for private album
                                        // Let's just open image directly for now or implement proper lightbox later
                                        window.open(img, '_blank');
                                    }}>
                                        <img src={img} alt={`Private ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                borderRadius: '12px',
                                padding: '30px',
                                textAlign: 'center',
                                border: '1px dashed #333'
                            }}>
                                <span className="material-icons" style={{ fontSize: '48px', color: '#666', marginBottom: '15px' }}>lock</span>
                                <p style={{ color: '#888', marginBottom: '20px' }}>
                                    อัลบั้มนี้เป็นส่วนตัว ต้องได้รับอนุญาตจากเจ้าของก่อน
                                </p>
                                {albumAccess.hasPendingRequest ? (
                                    <button disabled style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#333',
                                        color: '#888',
                                        cursor: 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        margin: '0 auto'
                                    }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>hourglass_empty</span>
                                        รอการอนุมัติ
                                    </button>
                                ) : (
                                    <button onClick={handleRequestAccess} style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#a607d6',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        margin: '0 auto'
                                    }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>key</span>
                                        ขอสิทธิ์เข้าถึง
                                    </button>
                                )}
                            </div>
                        )}
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

            {/* Report User Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReportModal(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '15px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px' }}>รายงานผู้ใช้</h3>
                            <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>กรุณาเลือกเหตุผลที่คุณต้องการรายงานผู้ใช้นี้</p>
                        <div style={{ marginBottom: '20px' }}>
                            {['spam', 'อนาจาร', 'กล่าวร้ายผู้อื่น', 'แอบอ้าง', 'หลอกลวง', 'โปรไฟล์ปลอม', 'การล่วงละเมิด'].map((reason) => (
                                <div key={reason} onClick={() => setReportReason(reason)} style={{ padding: '15px', marginBottom: '10px', borderRadius: '10px', border: `2px solid ${reportReason === reason ? '#a607d6' : '#333'}`, backgroundColor: reportReason === reason ? 'rgba(166, 7, 214, 0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${reportReason === reason ? '#a607d6' : '#666'}`, backgroundColor: reportReason === reason ? '#a607d6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {reportReason === reason && (<span className="material-icons" style={{ fontSize: '14px', color: 'white' }}>check</span>)}
                                    </div>
                                    <span>{reason}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                            <textarea value={reportAdditionalInfo} onChange={(e) => setReportAdditionalInfo(e.target.value)} placeholder="อธิบายเพิ่มเติมเกี่ยวกับปัญหา..." style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: 'white', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowReportModal(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '500' }}>ยกเลิก</button>
                            <button onClick={confirmReport} disabled={!reportReason} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: reportReason ? '#ff4444' : '#555', color: 'white', cursor: reportReason ? 'pointer' : 'not-allowed', fontWeight: '500' }}>ส่งรายงาน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Success Modal */}
            {showReportSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease-in' }} onClick={() => setShowReportSuccessModal(false)}>
                    <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '40px 30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'scaleIn 0.4s ease-out' }}>
                            <span className="material-icons" style={{ fontSize: '48px', color: '#4CAF50' }}>check_circle</span>
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600' }}>ส่งรายงานสำเร็จ</h3>
                        <p style={{ color: '#888', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>ขอบคุณที่แจ้งให้เราทราบ<br />ทีมงานจะตรวจสอบและดำเนินการโดยเร็วที่สุด</p>
                        <button onClick={() => setShowReportSuccessModal(false)} style={{ width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(166, 7, 214, 0.3)' }}>เข้าใจแล้ว</button>
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
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600' }}>ส่งคำขอเรียบร้อย</h3>
                        <p style={{ color: '#888', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
                            เราได้แจ้งเตือนไปยังเจ้าของโปรไฟล์แล้ว<br />
                            กรุณารอการอนุมัติเพื่อเข้าชมอัลบั้มส่วนตัว
                        </p>
                        <button onClick={() => setShowAccessRequestModal(false)} style={{ width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(166, 7, 214, 0.3)' }}>ตกลง</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
