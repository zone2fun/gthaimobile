import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import { getNotifications, markNotificationAsRead } from '../services/api';

const Header = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTags, setSearchTags] = useState([]);
    const [chipsWidth, setChipsWidth] = useState(0);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const { logout, user } = useContext(AuthContext);
    const { disconnectSocket } = useContext(SocketContext);
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);
    const chipsRef = useRef(null);
    const isSpecialPage = location.pathname === '/special';

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { socket } = useContext(SocketContext);
    const notificationRef = useRef(null);

    // Fetch notifications
    useEffect(() => {
        if (user && localStorage.getItem('token')) {
            const fetchNotifications = async () => {
                try {
                    const data = await getNotifications(localStorage.getItem('token'));
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.read).length);
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            };
            fetchNotifications();
        }
    }, [user]);

    // Listen for real-time notifications
    useEffect(() => {
        if (socket) {
            const handleNewNotification = (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            };

            socket.on('new notification', handleNewNotification);

            return () => {
                socket.off('new notification', handleNewNotification);
            };
        }
    }, [socket]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                await markNotificationAsRead(notification._id, localStorage.getItem('token'));
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        setShowNotifications(false);

        if (notification.type === 'like_post' && notification.post) {
            // Navigate to post (assuming we have a post detail page or just go to feed)
            // For now, let's go to the user's profile or feed
            // Ideally we should have a /post/:id route
            navigate(`/post/${notification.post._id || notification.post}`);
        }
    };

    const handleLogout = () => {
        disconnectSocket();
        logout();
        setShowMenu(false);
        navigate('/login');
    };

    // Sync tags from URL
    useEffect(() => {
        if (isSpecialPage) {
            const params = new URLSearchParams(location.search);
            const hashtagParam = params.get('hashtag');
            if (hashtagParam) {
                setSearchTags(hashtagParam.split(',').filter(t => t));
            } else {
                setSearchTags([]);
            }
        } else {
            setSearchTags([]);
        }
    }, [location.search, isSpecialPage]);

    // Measure chips width
    useEffect(() => {
        if (chipsRef.current) {
            setChipsWidth(chipsRef.current.offsetWidth);
        }
    }, [searchTags]);

    // Search users as user types
    useEffect(() => {
        if (isSpecialPage) return;

        const searchUsers = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setShowDropdown(false);
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const allUsers = await response.json();

                const filtered = allUsers.filter(user =>
                    user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5);

                setSearchResults(filtered);
                setShowDropdown(filtered.length > 0);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, isSpecialPage]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            if (isSpecialPage) {
                const newTags = [...searchTags, searchQuery.trim()];
                navigate(`/special?hashtag=${encodeURIComponent(newTags.join(','))}`);
            } else {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
            setSearchQuery('');
            setShowDropdown(false);
        }
    };

    const handleKeyDown = (e) => {
        if (!isSpecialPage) return;

        if (e.key === 'Backspace' && !searchQuery && searchTags.length > 0) {
            const newTags = searchTags.slice(0, -1);
            if (newTags.length > 0) {
                navigate(`/special?hashtag=${encodeURIComponent(newTags.join(','))}`);
            } else {
                navigate('/special');
            }
        }
    };

    const removeTag = (indexToRemove) => {
        const newTags = searchTags.filter((_, index) => index !== indexToRemove);
        if (newTags.length > 0) {
            navigate(`/special?hashtag=${encodeURIComponent(newTags.join(','))}`);
        } else {
            navigate('/special');
        }
    };

    const handleSelectUser = (userId) => {
        navigate(`/user/${userId}`);
        setSearchQuery('');
        setShowDropdown(false);
    };

    return (
        <header className="app-header">
            <img src="/logo.png" alt="Logo" className="logo" style={{ marginRight: '15px' }} />

            {/* Mobile Search Icon */}
            <div className="mobile-search-icon" onClick={() => setShowMobileSearch(!showMobileSearch)}>
                <span className="material-icons">search</span>
            </div>

            {/* Desktop Search */}
            <div ref={searchRef} className="desktop-search-container" style={{ position: 'relative', flex: 1, marginRight: '15px' }}>
                <form className="search-bar" onSubmit={handleSearch}>
                    <span className="material-icons search-icon">search</span>

                    <input
                        type="text"
                        placeholder={isSpecialPage && searchTags.length > 0 ? "" : (isSpecialPage ? "ค้นหา Hashtag" : "ค้นหาจาก About Me")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => !isSpecialPage && searchResults.length > 0 && setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        style={{
                            paddingLeft: isSpecialPage && searchTags.length > 0 ? `${45 + chipsWidth}px` : undefined
                        }}
                    />

                    {
                        isSpecialPage && searchTags.length > 0 && (
                            <div
                                ref={chipsRef}
                                style={{
                                    position: 'absolute',
                                    left: '40px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    pointerEvents: 'none'
                                }}
                            >
                                {searchTags.map((tag, index) => (
                                    <div key={index} style={{
                                        backgroundColor: '#a607d6',
                                        color: 'white',
                                        borderRadius: '15px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        pointerEvents: 'auto'
                                    }}>
                                        #{tag}
                                        <span
                                            className="material-icons"
                                            style={{ fontSize: '14px', cursor: 'pointer' }}
                                            onClick={() => removeTag(index)}
                                        >close</span>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </form >

                {showDropdown && (
                    <div className="search-dropdown">
                        {searchResults.map((result) => (
                            <div
                                key={result._id || result.id}
                                className="search-dropdown-item"
                                onClick={() => handleSelectUser(result._id || result.id)}
                            >
                                <img
                                    src={result.img || '/user_avatar.png'}
                                    alt={result.name}
                                    className="search-dropdown-avatar"
                                />
                                <div className="search-dropdown-info">
                                    <div className="search-dropdown-name">{result.name}</div>
                                    <div className="search-dropdown-bio">
                                        {result.bio && result.bio.length > 50
                                            ? result.bio.substring(0, 50) + '...'
                                            : result.bio}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Search Overlay */}
            {showMobileSearch && (
                <div className="mobile-search-overlay">
                    <div className="mobile-search-header">
                        <span className="material-icons close-icon" onClick={() => setShowMobileSearch(false)}>arrow_back</span>
                        <form className="mobile-search-form" onSubmit={(e) => { handleSearch(e); setShowMobileSearch(false); }}>
                            <input
                                type="text"
                                placeholder={isSpecialPage && searchTags.length > 0 ? "" : (isSpecialPage ? "ค้นหา Hashtag" : "ค้นหาจาก About Me")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                style={{
                                    paddingLeft: isSpecialPage && searchTags.length > 0 ? `${15 + chipsWidth}px` : undefined
                                }}
                            />

                            {/* Chips for Mobile */}
                            {isSpecialPage && searchTags.length > 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {searchTags.map((tag, index) => (
                                        <div key={index} style={{
                                            backgroundColor: '#a607d6',
                                            color: 'white',
                                            borderRadius: '15px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            pointerEvents: 'auto'
                                        }}>
                                            #{tag}
                                            <span
                                                className="material-icons"
                                                style={{ fontSize: '14px', cursor: 'pointer' }}
                                                onClick={() => removeTag(index)}
                                            >close</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery && (
                                <span className="material-icons clear-icon" onClick={() => setSearchQuery('')}>close</span>
                            )}
                        </form>
                    </div>
                </div>
            )}

            <div className="menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
                {user && (
                    <div ref={notificationRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <span className="material-icons" style={{ color: '#fff', fontSize: '24px' }}>notifications</span>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>

                        {showNotifications && (
                            <div className="dropdown-menu" style={{
                                right: '-50px',
                                width: '300px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                padding: '0'
                            }}>
                                <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                                    Notifications
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{
                                                padding: '10px 15px',
                                                borderBottom: '1px solid #333',
                                                cursor: 'pointer',
                                                backgroundColor: notification.read ? 'transparent' : 'rgba(166, 7, 214, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            <img
                                                src={notification.sender.img || '/user_avatar.png'}
                                                alt={notification.sender.name}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px' }}>
                                                    <strong>{notification.sender.name}</strong> liked your post
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {notification.post && notification.post.image && (
                                                <img
                                                    src={notification.post.image}
                                                    alt="Post"
                                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button className="menu-btn" onClick={() => setShowMenu(!showMenu)} style={{ padding: 0, background: 'none', border: 'none' }}>
                    {user ? (
                        <img
                            src={user.img || '/user_avatar.png'}
                            alt={user.name}
                            onError={(e) => { e.target.src = '/user_avatar.png'; }}
                            className="avatar"
                            style={{
                                border: '2px solid #a607d6',
                                cursor: 'pointer',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <span className="material-icons">menu</span>
                    )}
                </button>
                {showMenu && (
                    <div className="dropdown-menu">
                        {user ? (
                            <>
                                <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', fontSize: '14px', color: '#888' }}>
                                    Signed in as <strong>{user.name}</strong>
                                </div>
                                <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/blocked-users'); }}>
                                    Block Listing
                                </button>
                                <button className="dropdown-item" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', fontSize: '14px', color: '#888' }}>
                                    Signed in as <strong>Guest</strong>
                                </div>
                                <button className="dropdown-item" onClick={() => navigate('/login')}>
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div >
        </header >
    );
};

export default Header;
