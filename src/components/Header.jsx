import React from 'react';

const Header = () => {
    return (
        <header className="app-header">
            <div className="search-bar">
                <span className="material-icons search-icon">search</span>
                <input type="text" placeholder="ค้นหา" />
            </div>
            <button className="menu-btn">
                <span className="material-icons">menu</span>
            </button>
        </header>
    );
};

export default Header;
