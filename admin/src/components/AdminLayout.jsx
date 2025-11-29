import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Get admin user from localStorage
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAdmin = adminUser.role === 'admin';

    const menuItems = [
        { path: '/', icon: 'dashboard', label: 'Dashboard', allowedRoles: ['admin', 'editor'] },
        { path: '/users', icon: 'people', label: 'User Management', allowedRoles: ['admin', 'editor'] },
        { path: '/moderation', icon: 'gavel', label: 'Content Moderation', allowedRoles: ['admin', 'editor'] },
        { path: '/reports', icon: 'flag', label: 'Reports', allowedRoles: ['admin', 'editor'] },
        { path: '/announcements', icon: 'campaign', label: 'Announcements', allowedRoles: ['admin', 'editor'] },
        { path: '/approve-photo', icon: 'photo_library', label: 'Approve Photo', allowedRoles: ['admin', 'editor'] },
        { path: '/approve-posts', icon: 'article', label: 'Approve Posts', allowedRoles: ['admin', 'editor'] },
        { path: '/settings', icon: 'settings', label: 'System Settings', allowedRoles: ['admin'] },
    ];

    // Filter menu items based on role
    const filteredMenuItems = menuItems.filter(item =>
        item.allowedRoles.includes(adminUser.role)
    );

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <aside style={{ ...styles.sidebar, width: isSidebarOpen ? '260px' : '80px' }}>
                <div style={styles.logoContainer}>
                    {isSidebarOpen ? (
                        <h2 style={styles.logoText}>GThai <span style={{ color: '#a607d6' }}>Admin</span></h2>
                    ) : (
                        <h2 style={styles.logoText}>GT</h2>
                    )}
                </div>

                <nav style={styles.nav}>
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...styles.navItem,
                                backgroundColor: location.pathname === item.path ? 'rgba(166, 7, 214, 0.15)' : 'transparent',
                                color: location.pathname === item.path ? '#a607d6' : '#a0a0a0',
                                borderLeft: location.pathname === item.path ? '3px solid #a607d6' : '3px solid transparent',
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '24px', minWidth: '40px', textAlign: 'center' }}>
                                {item.icon}
                            </span>
                            {isSidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div style={styles.footer}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <span className="material-icons">logout</span>
                        {isSidebarOpen && <span style={{ marginLeft: '10px' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.toggleBtn}>
                        <span className="material-icons">menu</span>
                    </button>
                    <div style={styles.headerRight}>
                        <div style={styles.adminProfile}>
                            <div style={styles.avatar}>{adminUser.name ? adminUser.name[0].toUpperCase() : 'A'}</div>
                            <div>
                                <div style={styles.adminName}>{adminUser.name || 'Admin User'}</div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                    {adminUser.role === 'admin' ? 'Administrator' : 'Editor'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div style={styles.content}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        backgroundColor: '#121212',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        zIndex: 10,
    },
    logoContainer: {
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #333',
    },
    logoText: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
    nav: {
        flex: 1,
        padding: '20px 0',
        overflowY: 'auto',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        marginBottom: '5px',
    },
    navLabel: {
        marginLeft: '10px',
        fontSize: '14px',
        fontWeight: '500',
    },
    footer: {
        padding: '20px',
        borderTop: '1px solid #333',
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '10px',
        backgroundColor: '#2a2a2a',
        border: 'none',
        borderRadius: '8px',
        color: '#ff4444',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        height: '64px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
    },
    toggleBtn: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '5px',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
    },
    adminProfile: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#a607d6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    adminName: {
        fontSize: '14px',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        backgroundColor: '#121212',
    },
};

export default AdminLayout;
