import React, { useState, useEffect } from 'react';
import { ConfirmModal, AlertModal } from '../components/CustomModals';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterVerified, setFilterVerified] = useState('all');
    const [filterCountry, setFilterCountry] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Modal States
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger' });
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const API_URL = 'http://localhost:5000/api/admin';
    const token = localStorage.getItem('adminToken');

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/users?page=${currentPage}&limit=10&search=${searchTerm}&status=${filterStatus}&verified=${filterVerified}&country=${filterCountry}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/users/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [currentPage, searchTerm, filterStatus, filterVerified, filterCountry]);

    // Toggle ban user
    const handleToggleBan = (userId, currentBanStatus) => {
        setConfirmModal({
            isOpen: true,
            title: currentBanStatus ? 'Unban User' : 'Ban User',
            message: `Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`,
            type: currentBanStatus ? 'info' : 'danger',
            confirmText: currentBanStatus ? 'Unban' : 'Ban',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_URL}/users/${userId}/ban`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        // Optimistic update
                        setUsers(users.map(user =>
                            user._id === userId ? { ...user, isBanned: !currentBanStatus } : user
                        ));

                        if (selectedUser && selectedUser._id === userId) {
                            setSelectedUser(prev => ({ ...prev, isBanned: !currentBanStatus }));
                        }

                        fetchStats();
                        setAlertModal({
                            isOpen: true,
                            title: 'Success',
                            message: `User ${currentBanStatus ? 'unbanned' : 'banned'} successfully`,
                            type: 'success'
                        });
                    }
                } catch (error) {
                    console.error('Error toggling ban:', error);
                    setAlertModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to update user status',
                        type: 'error'
                    });
                }
            }
        });
    };

    // Delete user
    const handleDeleteUser = (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_URL}/users/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        fetchUsers();
                        fetchStats();
                        setAlertModal({
                            isOpen: true,
                            title: 'Success',
                            message: 'User deleted successfully',
                            type: 'success'
                        });
                    } else {
                        const data = await response.json();
                        setAlertModal({
                            isOpen: true,
                            title: 'Error',
                            message: data.message || 'Failed to delete user',
                            type: 'error'
                        });
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    setAlertModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to delete user',
                        type: 'error'
                    });
                }
            }
        });
    };

    // View user details
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>User Management</h1>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: 'rgba(166, 7, 214, 0.1)', color: '#a607d6' }}>
                        <span className="material-icons">people</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Total Users</p>
                        <h3 style={styles.statValue}>{stats.totalUsers || 0}</h3>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                        <span className="material-icons">check_circle</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Active Users</p>
                        <h3 style={styles.statValue}>{stats.activeUsers || 0}</h3>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                        <span className="material-icons">wifi</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Online Now</p>
                        <h3 style={styles.statValue}>{stats.onlineUsers || 0}</h3>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444' }}>
                        <span className="material-icons">block</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Banned Users</p>
                        <h3 style={styles.statValue}>{stats.bannedUsers || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
                <div style={styles.searchBox}>
                    <span className="material-icons" style={styles.searchIcon}>search</span>
                    <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={styles.searchInput}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={styles.select}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
                <select
                    value={filterVerified}
                    onChange={(e) => {
                        setFilterVerified(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={styles.select}
                >
                    <option value="all">All Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                </select>
                <select
                    value={filterCountry}
                    onChange={(e) => {
                        setFilterCountry(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={styles.select}
                >
                    <option value="all">All Countries</option>
                    <option value="Thailand">Thailand</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="Korea">Korea</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Laos">Laos</option>
                    <option value="Myanmar">Myanmar</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="India">India</option>
                    <option value="Russia">Russia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Users Table */}
            {loading ? (
                <div style={styles.loading}>Loading...</div>
            ) : (
                <>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>User</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Joined</th>
                                    <th style={styles.th}>Verified</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img
                                                    src={user.img || '/default-avatar.png'}
                                                    alt={user.name}
                                                    style={styles.userAvatar}
                                                    onError={(e) => e.target.src = '/default-avatar.png'}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{user.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: user.isBanned ? 'rgba(255, 68, 68, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                                color: user.isBanned ? '#ff4444' : '#2ecc71'
                                            }}>
                                                {user.isBanned ? 'Banned' : 'Active'}
                                            </span>
                                            {user.isOnline && (
                                                <span style={{ marginLeft: '5px', color: '#2ecc71', fontSize: '12px' }}>● Online</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            {user.isVerified ? (
                                                <span className="material-icons" style={{ color: '#2ecc71', fontSize: '20px' }}>verified</span>
                                            ) : (
                                                <span className="material-icons" style={{ color: '#666', fontSize: '20px' }}>cancel</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    style={styles.actionBtn}
                                                    title="View Details"
                                                    onClick={() => handleViewUser(user)}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '18px' }}>visibility</span>
                                                </button>
                                                <button
                                                    style={{ ...styles.actionBtn, color: user.isBanned ? '#2ecc71' : '#ff4444' }}
                                                    title={user.isBanned ? 'Unban' : 'Ban'}
                                                    onClick={() => handleToggleBan(user._id, user.isBanned)}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '18px' }}>
                                                        {user.isBanned ? 'check_circle' : 'block'}
                                                    </span>
                                                </button>
                                                <button
                                                    style={{ ...styles.actionBtn, color: '#ff4444' }}
                                                    title="Delete"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={styles.pagination}>
                        <button
                            style={styles.paginationBtn}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span style={styles.pageInfo}>
                            Page {currentPage} of {totalPages} ({total} total users)
                        </span>
                        <button
                            style={styles.paginationBtn}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* User Details Modal */}
            {showEditModal && selectedUser && (
                <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>User Details</h2>
                            <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <img
                                    src={selectedUser.img || '/default-avatar.png'}
                                    alt={selectedUser.name}
                                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Name:</strong> {selectedUser.name}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Username:</strong> @{selectedUser.username}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Email:</strong> {selectedUser.email}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Bio:</strong> {selectedUser.bio || 'No bio'}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Age:</strong> {selectedUser.age || 'N/A'}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Location:</strong> {selectedUser.location?.city || 'Unknown'}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Country:</strong> {selectedUser.country || 'Thailand'}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Status:</strong>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor: selectedUser.isBanned ? 'rgba(255, 68, 68, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                    color: selectedUser.isBanned ? '#ff4444' : '#2ecc71',
                                    marginLeft: '10px'
                                }}>
                                    {selectedUser.isBanned ? 'Banned' : 'Active'}
                                </span>
                                {selectedUser.isOnline && (
                                    <span style={{ marginLeft: '10px', color: '#2ecc71', fontSize: '12px' }}>● Online</span>
                                )}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Last Login IP:</strong> {selectedUser.lastLoginIp || 'N/A'}
                            </div>
                            <div style={styles.detailRow}>
                                <strong>Registration IP:</strong> {selectedUser.registrationIp || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
    },
    statCard: {
        backgroundColor: '#1a1a1a',
        padding: '15px',
        borderRadius: '10px',
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    statIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        color: '#a0a0a0',
        fontSize: '12px',
        margin: 0,
    },
    statValue: {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: '5px 0 0 0',
    },
    filterBar: {
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
    },
    searchBox: {
        flex: 1,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#666',
        fontSize: '20px',
    },
    searchInput: {
        width: '100%',
        padding: '10px 10px 10px 40px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
    },
    select: {
        padding: '10px 15px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#a0a0a0',
    },
    tableContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '15px',
        color: '#a0a0a0',
        fontSize: '12px',
        fontWeight: '600',
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a',
    },
    td: {
        padding: '15px',
        borderBottom: '1px solid #2a2a2a',
        fontSize: '14px',
    },
    tr: {},
    userAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
    },
    actionBtn: {
        padding: '6px',
        backgroundColor: '#2a2a2a',
        border: 'none',
        borderRadius: '6px',
        color: '#a0a0a0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '20px',
    },
    paginationBtn: {
        padding: '8px 16px',
        backgroundColor: '#2a2a2a',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
    },
    pageInfo: {
        color: '#a0a0a0',
        fontSize: '14px',
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
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid #333',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #333',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
    },
    modalBody: {
        padding: '20px',
    },
    detailRow: {
        padding: '10px 0',
        borderBottom: '1px solid #2a2a2a',
    },
};

export default UserManagement;
