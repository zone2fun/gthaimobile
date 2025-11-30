import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await axios.get(`${API_URL}/api/admin/users/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        return num.toLocaleString();
    };

    const statCards = stats ? [
        {
            title: 'Total Members',
            value: formatNumber(stats.totalUsers),
            icon: 'people',
            color: '#a607d6',
            subtitle: 'All registered users'
        },
        {
            title: 'Active Users',
            value: formatNumber(stats.activeUsers),
            icon: 'check_circle',
            color: '#2ecc71',
            subtitle: 'Not banned users'
        },
        {
            title: 'Online Now',
            value: formatNumber(stats.onlineUsers),
            icon: 'wifi',
            color: '#3498db',
            subtitle: 'Currently online'
        },
        {
            title: 'Banned Users',
            value: formatNumber(stats.bannedUsers),
            icon: 'block',
            color: '#ff4444',
            subtitle: 'Suspended accounts'
        },
        {
            title: 'Fake Users',
            value: formatNumber(stats.fakeUsers),
            icon: 'smart_toy',
            color: '#ff9800',
            subtitle: 'Generated accounts'
        },
    ] : [];

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={{ color: '#a0a0a0', marginTop: '20px' }}>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <span className="material-icons" style={{ fontSize: '48px', color: '#ff4444' }}>error_outline</span>
                <p style={{ color: '#ff4444', marginTop: '10px' }}>{error}</p>
                <button onClick={fetchStats} style={styles.retryBtn}>Retry</button>
            </div>
        );
    }

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Dashboard</h1>
                <button onClick={fetchStats} style={styles.refreshBtn}>
                    <span className="material-icons">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
                {statCards.map((stat, index) => (
                    <div key={index} style={styles.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={styles.statTitle}>{stat.title}</p>
                                <h3 style={styles.statValue}>{stat.value}</h3>
                                <p style={styles.statSubtitle}>{stat.subtitle}</p>
                            </div>
                            <div style={{ ...styles.iconBox, backgroundColor: `${stat.color}20`, color: stat.color }}>
                                <span className="material-icons">{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            {stats && (
                <div style={styles.additionalStats}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>User Overview</h3>
                        <div style={styles.statsRow}>
                            <div style={styles.statItem}>
                                <span className="material-icons" style={{ color: '#a607d6', fontSize: '20px' }}>verified</span>
                                <div style={{ marginLeft: '10px' }}>
                                    <p style={styles.statItemLabel}>Verified Users</p>
                                    <p style={styles.statItemValue}>{formatNumber(stats.verifiedUsers)}</p>
                                </div>
                            </div>
                            <div style={styles.statItem}>
                                <span className="material-icons" style={{ color: '#2ecc71', fontSize: '20px' }}>trending_up</span>
                                <div style={{ marginLeft: '10px' }}>
                                    <p style={styles.statItemLabel}>Active Rate</p>
                                    <p style={styles.statItemValue}>
                                        {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>
                            <div style={styles.statItem}>
                                <span className="material-icons" style={{ color: '#3498db', fontSize: '20px' }}>people_outline</span>
                                <div style={{ marginLeft: '10px' }}>
                                    <p style={styles.statItemLabel}>Online Rate</p>
                                    <p style={styles.statItemValue}>
                                        {stats.totalUsers > 0 ? ((stats.onlineUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Status */}
            <div style={styles.sectionGrid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>System Status</h3>
                    <div style={styles.statusList}>
                        <div style={styles.statusItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons" style={{ color: '#2ecc71' }}>check_circle</span>
                                <span>API Server</span>
                            </div>
                            <span style={{ color: '#2ecc71', fontSize: '12px' }}>Operational</span>
                        </div>
                        <div style={styles.statusItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons" style={{ color: '#2ecc71' }}>check_circle</span>
                                <span>Database</span>
                            </div>
                            <span style={{ color: '#2ecc71', fontSize: '12px' }}>Operational</span>
                        </div>
                        <div style={styles.statusItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons" style={{ color: '#2ecc71' }}>check_circle</span>
                                <span>Socket Server</span>
                            </div>
                            <span style={{ color: '#2ecc71', fontSize: '12px' }}>Operational</span>
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Quick Actions</h3>
                    <div style={styles.actionsList}>
                        <button style={styles.actionBtn} onClick={() => window.location.href = '/users'}>
                            <span className="material-icons">people</span>
                            <span>Manage Users</span>
                        </button>
                        <button style={styles.actionBtn} onClick={() => window.location.href = '/moderation'}>
                            <span className="material-icons">gavel</span>
                            <span>Content Moderation</span>
                        </button>
                        <button style={styles.actionBtn} onClick={() => window.location.href = '/approve-photo'}>
                            <span className="material-icons">photo_library</span>
                            <span>Approve Photos</span>
                        </button>
                        <button style={styles.actionBtn} onClick={() => window.location.href = '/reports'}>
                            <span className="material-icons">flag</span>
                            <span>View Reports</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const styles = {
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
    },
    spinner: {
        border: '4px solid #333',
        borderTop: '4px solid #a607d6',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
    },
    retryBtn: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#a607d6',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background 0.2s',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
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
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
    },
    statCard: {
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #333',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
    },
    statTitle: {
        color: '#a0a0a0',
        fontSize: '14px',
        marginBottom: '8px',
        margin: 0,
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        margin: '5px 0',
    },
    statSubtitle: {
        color: '#666',
        fontSize: '12px',
        margin: '5px 0 0 0',
    },
    iconBox: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    },
    additionalStats: {
        marginBottom: '30px',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#2a2a2a',
        borderRadius: '10px',
        border: '1px solid #333',
    },
    statItemLabel: {
        color: '#a0a0a0',
        fontSize: '12px',
        margin: '0 0 5px 0',
    },
    statItemValue: {
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: 0,
    },
    sectionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
    },
    card: {
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #333',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 15px 0',
    },
    statusList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '15px',
    },
    statusItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        border: '1px solid #333',
    },
    actionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '15px',
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
        textAlign: 'left',
    },
};

// Add keyframes for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
} catch (e) {
    // Ignore if already exists
}

export default Dashboard;

