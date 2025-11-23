import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = () => {
    const [showMenu, setShowMenu] = useState(false);
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setShowMenu(false);
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div className="search-bar">
                <span className="material-icons search-icon">search</span>
                <input type="text" placeholder="ค้นหา" />
            </div>
            <div style={{ position: 'relative' }}>
                <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
                    <span className="material-icons">menu</span>
                </button>
                {showMenu && (
                    <div className="dropdown-menu">
                        {user && (
                            <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', fontSize: '14px', color: '#888' }}>
                                Signed in as <strong>{user.name}</strong>
                            </div>
                        )}
                        <button className="dropdown-item" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
