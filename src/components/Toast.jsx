import React, { useEffect } from 'react';

const Toast = ({ message, avatar, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto close after 4 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-notification">
            <div className="toast-content">
                {avatar && (
                    <img
                        src={avatar}
                        alt="User"
                        className="toast-avatar"
                    />
                )}
                <div className="toast-message">
                    <div className="toast-title">Favorite is Online!</div>
                    <div className="toast-text">{message}</div>
                </div>
                <button className="toast-close" onClick={onClose}>
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>
    );
};

export default Toast;
