import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SocketContext from '../context/SocketContext';

const BottomNav = () => {
    const { unreadCount } = useContext(SocketContext);
    const { t } = useTranslation();

    return (
        <nav className="bottom-nav">
            <NavLink to="/favourites" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">star_border</span>
                <span className="nav-label">{t('nav.favourites')}</span>
            </NavLink>
            <NavLink to="/special" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">layers</span>
                <span className="nav-label">{t('nav.special')}</span>
            </NavLink>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">groups</span>
                <span className="nav-label">GTHAI</span>
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <div style={{ position: 'relative' }}>
                    <span className="material-icons">chat_bubble_outline</span>
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </div>
                <span className="nav-label">{t('nav.chat')}</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">person_outline</span>
                <span className="nav-label">{t('nav.profile')}</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
