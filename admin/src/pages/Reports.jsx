import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, resolved, dismissed, all
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            if (!token) {
                navigate('/login');
                return;
            }

            let url = `${API_URL}/api/reports`;
            if (filter !== 'all') {
                url += `?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data);
            } else {
                console.error('Failed to fetch reports');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh list
                fetchReports();
            } else {
                alert('Failed to update report status');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Error updating report');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('th-TH');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Reports Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['pending', 'resolved', 'dismissed', 'all'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: filter === status ? '#a607d6' : '#333',
                                color: 'white',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>
            ) : reports.length === 0 ? (
                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '40px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                }}>
                    <span className="material-icons" style={{ fontSize: '64px', color: '#333', marginBottom: '20px' }}>
                        inbox
                    </span>
                    <p style={{ color: '#888' }}>No reports found</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {reports.map(report => (
                        <div key={report._id} style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #333'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: report.reportType === 'user' ? '#E91E63' : '#2196F3',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {report.reportType.toUpperCase()}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '14px' }}>
                                        {formatDate(report.createdAt)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        color: report.status === 'pending' ? '#FFC107' :
                                            report.status === 'resolved' ? '#4CAF50' : '#9E9E9E',
                                        fontWeight: 'bold',
                                        textTransform: 'capitalize'
                                    }}>
                                        {report.status}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                {/* Reporter Info */}
                                <div>
                                    <h4 style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>REPORTER</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={report.reporter?.img || '/user_avatar.png'}
                                            alt="Reporter"
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{report.reporter?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>ID: {report.reporter?._id}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reported Content Info */}
                                <div>
                                    <h4 style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>REPORTED {report.reportType.toUpperCase()}</h4>
                                    {report.reportType === 'user' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={report.reportedUser?.img || '/user_avatar.png'}
                                                alt="Reported User"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{report.reportedUser?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>
                                                    Warnings: {report.reportedUser?.warningCount || 0}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {report.post?.image && (
                                                <img
                                                    src={report.post.image}
                                                    alt="Post"
                                                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div>
                                                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                                    {report.post?.content || 'No content'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>
                                                    By: {report.post?.user?.name || 'Unknown'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ marginBottom: '5px' }}>
                                    <span style={{ color: '#a607d6', fontWeight: 'bold' }}>Reason: </span>
                                    <span>{report.reason}</span>
                                </div>
                                {report.additionalInfo && (
                                    <div>
                                        <span style={{ color: '#888', fontSize: '14px' }}>Note: </span>
                                        <span style={{ fontSize: '14px' }}>{report.additionalInfo}</span>
                                    </div>
                                )}
                            </div>

                            {report.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleStatusUpdate(report._id, 'dismissed')}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #555',
                                            backgroundColor: 'transparent',
                                            color: '#ccc',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(report._id, 'resolved')}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: '#F44336',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Take Action (Resolve)
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
