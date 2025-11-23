import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            <NavLink to="/favourites" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">star_border</span>
                <span className="nav-label">ที่คุณชอบ</span>
            </NavLink>
            <NavLink to="/special" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">layers</span>
                <span className="nav-label">พิเศษ</span>
            </NavLink>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">masks</span>
                <span className="nav-label">GTHAI</span>
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="material-icons">chat_bubble_outline</span>
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
