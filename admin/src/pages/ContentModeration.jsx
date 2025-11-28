import React, { useState, useEffect } from 'react';
import { AlertModal } from '../components/CustomModals';

const ContentModeration = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], currentIndex: 0 });

    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('adminToken');

    // Fetch reports
    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/reports?status=${filterStatus}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filterStatus]);

    // Update report status
    const handleUpdateStatus = async (reportId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Remove from list if filtering by pending
                if (filterStatus === 'pending' && newStatus !== 'pending') {
                    setReports(reports.filter(r => r._id !== reportId));
                } else {
                    fetchReports();
                }
                setShowModal(false);
                setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: `Report marked as ${newStatus}`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error updating report status:', error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to update status',
                type: 'error'
            });
        }
    };

    // View report details
    const handleViewReport = (report) => {
        setSelectedReport(report);
        setShowModal(true);
    };

    // Gallery navigation
    const handleNextImage = () => {
        setGalleryModal(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length
        }));
    };

    const handlePrevImage = () => {
        setGalleryModal(prev => ({
            ...prev,
            currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
        }));
    };

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Content Moderation</h1>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
                <button
                    style={{
                        ...styles.filterBtn,
                        backgroundColor: filterStatus === 'pending' ? '#a607d6' : '#2a2a2a',
                        color: filterStatus === 'pending' ? '#fff' : '#a0a0a0'
                    }}
                    onClick={() => setFilterStatus('pending')}
                >
                    Pending
                </button>
                <button
                    style={{
                        ...styles.filterBtn,
                        backgroundColor: filterStatus === 'resolved' ? '#a607d6' : '#2a2a2a',
                        color: filterStatus === 'resolved' ? '#fff' : '#a0a0a0'
                    }}
                    onClick={() => setFilterStatus('resolved')}
                >
                    Resolved
                </button>
                <button
                    style={{
                        ...styles.filterBtn,
                        backgroundColor: filterStatus === 'dismissed' ? '#a607d6' : '#2a2a2a',
                        color: filterStatus === 'dismissed' ? '#fff' : '#a0a0a0'
                    }}
                    onClick={() => setFilterStatus('dismissed')}
                >
                    Dismissed
                </button>
            </div>

            {/* Reports List */}
            {loading ? (
                <div style={styles.loading}>Loading reports...</div>
            ) : reports.length === 0 ? (
                <div style={styles.emptyState}>
                    <span className="material-icons" style={{ fontSize: '48px', color: '#333', marginBottom: '10px' }}>check_circle</span>
                    <p>No reports found with this status.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {reports.map((report) => (
                        <div key={report._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={{
                                    ...styles.typeBadge,
                                    backgroundColor: report.reportType === 'post' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(166, 7, 214, 0.1)',
                                    color: report.reportType === 'post' ? '#2ecc71' : '#a607d6'
                                }}>
                                    {report.reportType === 'post' ? 'Post Report' : 'User Report'}
                                </span>
                                <span style={styles.date}>{new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div style={styles.cardBody}>
                                <p style={styles.reason}><strong>Reason:</strong> {report.reason}</p>
                                {report.additionalInfo && (
                                    <p style={styles.info}>"{report.additionalInfo}"</p>
                                )}

                                <div style={styles.reporterInfo}>
                                    <span style={{ color: '#666', fontSize: '12px' }}>Reported by:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                        <img
                                            src={report.reporter?.img || '/default-avatar.png'}
                                            alt={report.reporter?.name}
                                            style={styles.reporterAvatar}
                                            onError={(e) => e.target.src = '/default-avatar.png'}
                                        />
                                        <span style={{ fontSize: '14px' }}>{report.reporter?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.cardFooter}>
                                <button
                                    style={styles.viewBtn}
                                    onClick={() => handleViewReport(report)}
                                >
                                    Review Content
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {showModal && selectedReport && (
                <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>Review Report</h2>
                            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.reportDetails}>
                                <div style={styles.detailItem}>
                                    <label>Report Type:</label>
                                    <span>{selectedReport.reportType.toUpperCase()}</span>
                                </div>
                                <div style={styles.detailItem}>
                                    <label>Reason:</label>
                                    <span>{selectedReport.reason}</span>
                                </div>
                                <div style={styles.detailItem}>
                                    <label>Additional Info:</label>
                                    <span>{selectedReport.additionalInfo || '-'}</span>
                                </div>
                            </div>

                            <div style={styles.contentPreview}>
                                <h3>Reported Content</h3>
                                {selectedReport.reportType === 'post' && selectedReport.post ? (
                                    <div style={styles.postPreview}>
                                        {selectedReport.post.image && (
                                            <img
                                                src={selectedReport.post.image}
                                                alt="Reported content"
                                                style={styles.previewImage}
                                            />
                                        )}
                                        <p style={styles.postContent}>{selectedReport.post.content}</p>
                                        <div style={styles.authorInfo}>
                                            Posted by: <strong>{selectedReport.post.user?.name || 'Unknown'}</strong>
                                        </div>
                                    </div>
                                ) : selectedReport.reportType === 'user' && selectedReport.reportedUser ? (
                                    <div style={styles.userPreview}>
                                        <img
                                            src={selectedReport.reportedUser?.img || '/default-avatar.png'}
                                            alt="Reported user"
                                            style={styles.userImage}
                                            onError={(e) => e.target.src = '/default-avatar.png'}
                                        />
                                        <h4 style={{ marginBottom: '15px' }}>{selectedReport.reportedUser?.name || 'Unknown User'}</h4>

                                        <div style={{ textAlign: 'left', marginTop: '20px' }}>
                                            <div style={styles.userDetailRow}>
                                                <strong>Username:</strong> @{selectedReport.reportedUser?.username || 'N/A'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Email:</strong> {selectedReport.reportedUser?.email || 'N/A'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Bio:</strong> {selectedReport.reportedUser?.bio || 'No bio'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Age:</strong> {selectedReport.reportedUser?.age || 'N/A'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Country:</strong> {selectedReport.reportedUser?.country || 'N/A'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Looking For:</strong> {selectedReport.reportedUser?.lookingFor?.join(', ') || 'N/A'}
                                            </div>
                                            <div style={styles.userDetailRow}>
                                                <strong>Joined:</strong> {selectedReport.reportedUser?.createdAt ? new Date(selectedReport.reportedUser.createdAt).toLocaleDateString() : 'N/A'}
                                            </div>

                                            {selectedReport.reportedUser?.gallery && selectedReport.reportedUser.gallery.length > 0 && (
                                                <div style={{ marginTop: '20px' }}>
                                                    <strong style={{ display: 'block', marginBottom: '10px' }}>Gallery:</strong>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                                        {selectedReport.reportedUser.gallery.map((img, index) => (
                                                            <img
                                                                key={index}
                                                                src={img}
                                                                alt={`Gallery ${index + 1}`}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => setGalleryModal({ isOpen: true, images: selectedReport.reportedUser.gallery, currentIndex: index })}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={styles.errorState}>Content not found or deleted</div>
                                )}
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            {selectedReport.status === 'pending' && (
                                <>
                                    <button
                                        style={{ ...styles.actionBtn, backgroundColor: '#2a2a2a', color: '#a0a0a0' }}
                                        onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                                    >
                                        Dismiss Report
                                    </button>
                                    <button
                                        style={{ ...styles.actionBtn, backgroundColor: '#ff4444', color: '#fff' }}
                                        onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                                    >
                                        Take Action & Resolve
                                    </button>
                                </>
                            )}
                            {selectedReport.status !== 'pending' && (
                                <div style={{ color: '#a0a0a0', fontStyle: 'italic' }}>
                                    This report is marked as {selectedReport.status}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Modal */}
            {galleryModal.isOpen && (
                <div style={styles.galleryModalOverlay} onClick={() => setGalleryModal({ isOpen: false, images: [], currentIndex: 0 })}>
                    <div style={styles.galleryModal} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setGalleryModal({ isOpen: false, images: [], currentIndex: 0 })} style={styles.galleryCloseBtn}>
                            <span className="material-icons">close</span>
                        </button>

                        <button onClick={handlePrevImage} style={{ ...styles.galleryNavBtn, left: '20px' }}>
                            <span className="material-icons">chevron_left</span>
                        </button>

                        <img
                            src={galleryModal.images[galleryModal.currentIndex]}
                            alt={`Gallery ${galleryModal.currentIndex + 1}`}
                            style={styles.galleryImage}
                        />

                        <button onClick={handleNextImage} style={{ ...styles.galleryNavBtn, right: '20px' }}>
                            <span className="material-icons">chevron_right</span>
                        </button>

                        <div style={styles.galleryCounter}>
                            {galleryModal.currentIndex + 1} / {galleryModal.images.length}
                        </div>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
};

const styles = {
    header: {
        marginBottom: '20px',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
    },
    filterBar: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    filterBtn: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#a0a0a0',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: '#666',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        padding: '15px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    date: {
        color: '#666',
        fontSize: '12px',
    },
    cardBody: {
        padding: '15px',
        flex: 1,
    },
    reason: {
        margin: '0 0 10px 0',
        fontSize: '14px',
    },
    info: {
        margin: '0 0 15px 0',
        fontSize: '13px',
        color: '#a0a0a0',
        fontStyle: 'italic',
    },
    reporterInfo: {
        marginTop: 'auto',
        paddingTop: '10px',
        borderTop: '1px solid #2a2a2a',
    },
    reporterAvatar: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    cardFooter: {
        padding: '15px',
        backgroundColor: '#222',
        borderTop: '1px solid #2a2a2a',
    },
    viewBtn: {
        width: '100%',
        padding: '8px',
        backgroundColor: '#a607d6',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333',
    },
    modalHeader: {
        padding: '20px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
    },
    modalBody: {
        padding: '20px',
        overflowY: 'auto',
    },
    reportDetails: {
        backgroundColor: '#222',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    detailItem: {
        display: 'flex',
        marginBottom: '8px',
        fontSize: '14px',
        '&:last-child': { marginBottom: 0 },
        gap: '10px',
    },
    contentPreview: {
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '15px',
    },
    postPreview: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    previewImage: {
        width: '100%',
        maxHeight: '300px',
        objectFit: 'contain',
        borderRadius: '8px',
        backgroundColor: '#000',
    },
    postContent: {
        fontSize: '14px',
        lineHeight: '1.5',
    },
    authorInfo: {
        fontSize: '12px',
        color: '#666',
        marginTop: '10px',
    },
    userPreview: {
        textAlign: 'center',
        padding: '20px',
    },
    userImage: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        marginBottom: '10px',
    },
    userDetailRow: {
        padding: '8px 0',
        fontSize: '14px',
        borderBottom: '1px solid #333',
    },
    errorState: {
        padding: '20px',
        textAlign: 'center',
        color: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        borderRadius: '8px',
    },
    modalFooter: {
        padding: '20px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    actionBtn: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
    },
    galleryModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    galleryModal: {
        position: 'relative',
        width: '90%',
        height: '90%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    galleryImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
    galleryCloseBtn: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '10px',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    galleryNavBtn: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '15px',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        zIndex: 10,
    },
    galleryCounter: {
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '20px',
        fontSize: '14px',
    },
};

export default ContentModeration;
