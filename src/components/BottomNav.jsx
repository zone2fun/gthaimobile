import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import SocketContext from '../context/SocketContext';

const BottomNav = () => {
    const { unreadCount } = useContext(SocketContext);
    return (
        <nav className="bottom-nav">
            <NavLink to="/favourites" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">star_border</span>
                <span className="nav-label">ที่คุณชอบ</span>
            </NavLink>
            <NavLink to="/special" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">layers</span>
                <span className="nav-label">โพสต์</span>
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
                <span className="nav-label">แชท</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">person_outline</span>
                <span className="nav-label">โปรไฟล์</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
