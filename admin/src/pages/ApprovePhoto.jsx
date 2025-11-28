import React, { useState, useEffect } from 'react';

const ApprovePhoto = () => {
    const [pendingPhotos, setPendingPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin';
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPendingPhotos();
    }, []);

    const fetchPendingPhotos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/photos/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingPhotos(data);
            }
        } catch (error) {
            console.error('Error fetching pending photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (photo) => {
        if (processingIds.has(photo._id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, photo._id]));

            const response = await fetch(`${API_URL}/photos/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: photo.userId,
                    photoType: photo.photoType,
                    photoUrl: photo.photoUrl
                })
            });

            if (response.ok) {
                setPendingPhotos(prev => prev.filter(p => p._id !== photo._id));
            } else {
                alert('Failed to approve photo');
            }
        } catch (error) {
            console.error('Error approving photo:', error);
            alert('Failed to approve photo');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(photo._id);
                return newSet;
            });
        }
    };

    const handleDeny = async (photo) => {
        if (processingIds.has(photo._id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, photo._id]));

            const response = await fetch(`${API_URL}/photos/deny`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: photo.userId,
                    photoType: photo.photoType,
                    photoUrl: photo.photoUrl
                })
            });

            if (response.ok) {
                setPendingPhotos(prev => prev.filter(p => p._id !== photo._id));
            } else {
                alert('Failed to deny photo');
            }
        } catch (error) {
            console.error('Error denying photo:', error);
            alert('Failed to deny photo');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(photo._id);
                return newSet;
            });
        }
    };

    const getPhotoTypeLabel = (type) => {
        switch (type) {
            case 'avatar':
                return 'Avatar';
            case 'cover':
                return 'Cover Photo';
            case 'gallery':
                return 'Gallery';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <h1 style={styles.pageTitle}>Photo Approval</h1>
                <div style={styles.loading}>Loading pending photos...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Photo Approval</h1>
            </div>
            <p style={styles.subtitle}>Review and approve user uploaded photos</p>

            {pendingPhotos.length === 0 ? (
                <div style={styles.noPhotos}>
                    <span className="material-icons" style={styles.noPhotosIcon}>photo_library</span>
                    <p style={styles.noPhotosText}>No pending photos to review</p>
                </div>
            ) : (
                <>
                    <div style={styles.stats}>
                        <span style={styles.pendingCount}>
                            {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? 's' : ''} pending approval
                        </span>
                    </div>
                    <div style={styles.photosGrid}>
                        {pendingPhotos.map((photo) => (
                            <div
                                key={photo._id}
                                className="photo-card-wrapper"
                                style={{
                                    ...styles.photoCard,
                                    opacity: processingIds.has(photo._id) ? 0.6 : 1,
                                    pointerEvents: processingIds.has(photo._id) ? 'none' : 'auto'
                                }}
                            >
                                <div style={styles.photoWrapper}>
                                    <img
                                        src={photo.photoUrl}
                                        alt={`${photo.username}'s ${photo.photoType}`}
                                        style={styles.photoImage}
                                    />
                                    <div className="photo-overlay" style={styles.photoOverlay}>
                                        <button
                                            style={styles.approveBtn}
                                            onClick={() => handleApprove(photo)}
                                            disabled={processingIds.has(photo._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>check</span>
                                            Allow
                                        </button>
                                        <button
                                            style={styles.denyBtn}
                                            onClick={() => handleDeny(photo)}
                                            disabled={processingIds.has(photo._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                                            Deny
                                        </button>
                                    </div>
                                </div>
                                <div style={styles.photoInfo}>
                                    <div style={styles.userInfo}>
                                        <span style={styles.username}>{photo.username}</span>
                                        <span style={styles.name}>{photo.name}</span>
                                    </div>
                                    <span style={styles.photoType}>{getPhotoTypeLabel(photo.photoType)}</span>
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
        marginBottom: '8px',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0,
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
    noPhotos: {
        textAlign: 'center',
        padding: '80px 20px',
        color: '#666',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
    },
    noPhotosIcon: {
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.5,
        display: 'block',
    },
    noPhotosText: {
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
    photosGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    photoCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
    },
    photoWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
    },
    photoImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    photoOverlay: {
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
    photoInfo: {
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #2a2a2a',
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    username: {
        fontWeight: '600',
        color: '#fff',
        fontSize: '14px',
    },
    name: {
        fontSize: '12px',
        color: '#a0a0a0',
    },
    photoType: {
        background: 'linear-gradient(135deg, #a607d6 0%, #7b00b8 100%)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
    },
};

// Add hover effect using CSS
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .photo-card-wrapper:hover .photo-overlay {
            opacity: 1 !important;
        }
        .photo-card-wrapper {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .photo-card-wrapper:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(166, 7, 214, 0.3);
        }
    `;
    if (!document.getElementById('photo-approval-styles')) {
        styleSheet.id = 'photo-approval-styles';
        document.head.appendChild(styleSheet);
    }
}

export default ApprovePhoto;
