import React, { useState, useEffect } from 'react';

const VerifiedRequests = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin';
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/verifications/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data);
            }
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (user) => {
        if (processingIds.has(user._id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, user._id]));

            const response = await fetch(`${API_URL}/verifications/${user._id}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPendingRequests(prev => prev.filter(req => req._id !== user._id));
            } else {
                alert('Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(user._id);
                return newSet;
            });
        }
    };

    const handleDeny = async (user) => {
        if (processingIds.has(user._id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, user._id]));

            const response = await fetch(`${API_URL}/verifications/${user._id}/deny`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPendingRequests(prev => prev.filter(req => req._id !== user._id));
            } else {
                alert('Failed to deny request');
            }
        } catch (error) {
            console.error('Error denying request:', error);
            alert('Failed to deny request');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(user._id);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <h1 style={styles.pageTitle}>Verified Requests</h1>
                <div style={styles.loading}>Loading pending requests...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Verified Requests</h1>
                <button onClick={fetchPendingRequests} style={styles.refreshBtn}>
                    <span className="material-icons">refresh</span>
                    Refresh
                </button>
            </div>
            <p style={styles.subtitle}>Review user verification requests (Camera photos only)</p>

            {pendingRequests.length === 0 ? (
                <div style={styles.noRequests}>
                    <span className="material-icons" style={styles.noRequestsIcon}>verified_user</span>
                    <p style={styles.noRequestsText}>No pending verification requests</p>
                </div>
            ) : (
                <>
                    <div style={styles.stats}>
                        <span style={styles.pendingCount}>
                            {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} pending
                        </span>
                    </div>
                    <div style={styles.requestsGrid}>
                        {pendingRequests.map((user) => (
                            <div
                                key={user._id}
                                className="request-card-wrapper"
                                style={{
                                    ...styles.requestCard,
                                    opacity: processingIds.has(user._id) ? 0.6 : 1,
                                    pointerEvents: processingIds.has(user._id) ? 'none' : 'auto'
                                }}
                            >
                                <div style={styles.imageWrapper}>
                                    <img
                                        src={user.verificationImage}
                                        alt={`${user.username}'s verification`}
                                        style={styles.verificationImage}
                                    />
                                    <div className="request-overlay" style={styles.requestOverlay}>
                                        <button
                                            style={styles.approveBtn}
                                            onClick={() => handleApprove(user)}
                                            disabled={processingIds.has(user._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>check</span>
                                            Approve
                                        </button>
                                        <button
                                            style={styles.denyBtn}
                                            onClick={() => handleDeny(user)}
                                            disabled={processingIds.has(user._id)}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                                            Deny
                                        </button>
                                    </div>
                                </div>
                                <div style={styles.info}>
                                    <div style={styles.userInfo}>
                                        <span style={styles.username}>{user.username}</span>
                                        <span style={styles.name}>{user.name}</span>
                                    </div>
                                    <div style={styles.date}>
                                        {new Date(user.verificationDate || user.createdAt).toLocaleDateString()}
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
    noRequests: {
        textAlign: 'center',
        padding: '80px 20px',
        color: '#666',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
    },
    noRequestsIcon: {
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.5,
        display: 'block',
    },
    noRequestsText: {
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
    requestsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    requestCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
    },
    verificationImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    requestOverlay: {
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
    info: {
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
    date: {
        fontSize: '11px',
        color: '#666',
    },
};

// Add hover effect using CSS
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .request-card-wrapper:hover .request-overlay {
            opacity: 1 !important;
        }
        .request-card-wrapper {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .request-card-wrapper:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(166, 7, 214, 0.3);
        }
    `;
    if (!document.getElementById('verified-request-styles')) {
        styleSheet.id = 'verified-request-styles';
        document.head.appendChild(styleSheet);
    }
}

export default VerifiedRequests;
