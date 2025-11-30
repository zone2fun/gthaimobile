import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import { getNotifications, markNotificationAsRead } from '../services/api';
import VerifiedAvatar from './VerifiedAvatar';
import LanguageSelector, { LanguageSelectorMobile } from './LanguageSelector';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTags, setSearchTags] = useState([]);
    const [chipsWidth, setChipsWidth] = useState(0);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const { logout, user, setUser } = useContext(AuthContext);
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

    // Use refs to store latest user and setUser - update during render
    const userRef = useRef(user);
    const setUserRef = useRef(setUser);
    userRef.current = user;
    setUserRef.current = setUser;

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

    // Listen for real-time notifications & photo approval
    useEffect(() => {
        console.log('🔵 Header: Socket effect running. Socket:', !!socket);

        if (socket) {
            console.log('🟢 Header: Registering socket listeners...');

            const handleNewNotification = (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            };

            const handlePhotoApproved = (data) => {
                console.log('🎯 Header: Photo approved event received', data);

                const currentUser = userRef.current;
                console.log('👤 Header: Current user from ref', currentUser);

                const currentUserId = currentUser?._id || currentUser?.id;
                const incomingUserId = data.userId;

                console.log(`🔍 Header: Comparing IDs - Incoming: "${incomingUserId}" vs Current: "${currentUserId}"`);

                // If avatar is approved and belongs to current user, update current user state
                if (currentUser && currentUserId && String(incomingUserId).trim() === String(currentUserId).trim()) {
                    console.log('✅ Header: User ID matches!');
                    if (data.photoType === 'Avatar' || data.photoType === 'avatar' || data.isAvatar) {
                        console.log('🖼️ Header: Updating avatar to', data.photoUrl);
                        const updatedUser = { ...currentUser, img: data.photoUrl };
                        setUserRef.current(updatedUser);
                        console.log('💾 Header: Avatar updated in state');
                    } else {
                        console.log('❌ Header: Photo type mismatch:', data.photoType);
                    }
                } else {
                    console.log('⚠️ Header: User ID mismatch or user not logged in');
                }
            };

            const handleAccountBanned = (data) => {
                disconnectSocket();
                logout();
                navigate('/login');
            };

            socket.on('new notification', handleNewNotification);
            socket.on('photo approved', handlePhotoApproved);
            socket.on('account_banned', handleAccountBanned);
            console.log('✅ Header: Socket listeners registered');

            return () => {
                console.log('🔴 Header: Cleaning up socket listeners');
                socket.off('new notification', handleNewNotification);
                socket.off('photo approved', handlePhotoApproved);
                socket.off('account_banned', handleAccountBanned);
            };
        } else {
            console.log('⚠️ Header: Socket is null, skipping listener registration');
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

        if (notification.post) {
            // Handle both populated object and ID string
            const postId = typeof notification.post === 'object' ? notification.post._id : notification.post;

            if (!postId) return; // Post might be deleted

            // If it's a comment notification, navigate to post with comment hash
            if (notification.type === 'comment_post' && notification.comment) {
                const commentId = typeof notification.comment === 'object' ? notification.comment._id : notification.comment;
                navigate(`/post/${postId}#comment-${commentId}`);
            } else if (notification.type === 'post_approved') {
                navigate(`/post/${postId}`);
            } else if (notification.type === 'post_rejected') {
                // Do nothing or maybe show a toast
            } else {
                navigate(`/post/${postId}`);
            }
        } else if (notification.type === 'photo_approved' || notification.type === 'photo_denied') {
            navigate(`/user/${user._id || user.id}`);
        } else if (notification.type === 'verification_approved' || notification.type === 'verification_denied') {
            navigate(`/edit-profile`);
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
            <img onClick={() => navigate('/')} src="/logo.png" alt="Logo" className="logo" style={{ marginRight: '15px', cursor: 'pointer' }} />

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
                        placeholder={isSpecialPage && searchTags.length > 0 ? "" : (isSpecialPage ? t('common.searchHashtag') : t('common.searchAboutMe'))}
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
                                placeholder={isSpecialPage && searchTags.length > 0 ? "" : (isSpecialPage ? t('common.searchHashtag') : t('common.searchAboutMe'))}
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
                <div className="desktop-only">
                    <LanguageSelector />
                </div>
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
                                    {t('common.notifications')}
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                        {t('common.noNotifications')}
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
                                            {notification.type === 'photo_approved' || notification.type === 'post_approved' || notification.type === 'verification_approved' ? (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span className="material-icons" style={{ color: '#4CAF50' }}>
                                                        {notification.type === 'verification_approved' ? 'verified' : 'check_circle'}
                                                    </span>
                                                </div>
                                            ) : notification.type === 'photo_denied' || notification.type === 'post_rejected' || notification.type === 'verification_denied' ? (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(244, 67, 54, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span className="material-icons" style={{ color: '#F44336' }}>cancel</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={notification.type === 'admin_notification' ? '/admin_avatar.png' : (notification.sender?.img || '/user_avatar.png')}
                                                    alt={notification.type === 'admin_notification' ? 'Admin' : (notification.sender?.name || 'System')}
                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px' }}>
                                                    {notification.type === 'admin_notification' ? (
                                                        <span style={{ color: '#ff4444' }}>{notification.message}</span>
                                                    ) : notification.type === 'photo_approved' || notification.type === 'post_approved' || notification.type === 'verification_approved' ? (
                                                        <span style={{ color: '#4CAF50' }}>{notification.message}</span>
                                                    ) : notification.type === 'photo_denied' || notification.type === 'post_rejected' || notification.type === 'verification_denied' ? (
                                                        <span style={{ color: '#F44336' }}>{notification.message}</span>
                                                    ) : (
                                                        <>
                                                            <strong>{notification.sender?.name || 'Unknown'}</strong> {notification.type === 'like_post' ? 'liked your post' : 'commented on your post'}
                                                        </>
                                                    )}
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
                        <VerifiedAvatar
                            src={user.img}
                            alt={user.name}
                            isVerified={user.isVerified}
                            size={40}
                            className="avatar"
                            style={{
                                border: '2px solid #a607d6',
                                cursor: 'pointer'
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
                                    {t('auth.signedInAs')} <strong>{user.name}</strong>
                                </div>
                                <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/safety-policy'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>security</span>
                                    {t('profile.safetyPolicy')}
                                </button>
                                <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/blocked-users'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>block</span>
                                    {t('profile.blockedUsers')}
                                </button>
                                <div className="mobile-only" style={{ borderTop: '1px solid #333' }}>
                                    <LanguageSelectorMobile />
                                </div>
                                <button className="dropdown-item" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>logout</span>
                                    {t('profile.logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', fontSize: '14px', color: '#888' }}>
                                    {t('auth.signedInAs')} <strong>{t('auth.guest')}</strong>
                                </div>
                                <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/safety-policy'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>security</span>
                                    {t('profile.safetyPolicy')}
                                </button>
                                <div className="mobile-only" style={{ borderTop: '1px solid #333' }}>
                                    <LanguageSelectorMobile />
                                </div>
                                <button className="dropdown-item" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px', color: '#a607d6' }}>login</span>
                                    {t('profile.login')}
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
