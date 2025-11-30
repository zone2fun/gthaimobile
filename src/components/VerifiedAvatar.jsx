import React from 'react';

const VerifiedAvatar = ({
    src,
    alt = 'User',
    isVerified = false,
    size = 40,
    style = {},
    className = '',
    onClick = null
}) => {
    const containerStyle = {
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        ...style
    };

    const avatarStyle = {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block'
    };

    const badgeSize = Math.max(16, size * 0.35); // Badge is 35% of avatar size, minimum 16px
    const badgeStyle = {
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
        width: `${badgeSize}px`,
        height: `${badgeSize}px`,
        backgroundColor: '#1DA1F2', // Twitter blue
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #1a1a1a', // Dark border to stand out
        boxShadow: '0 2px 8px rgba(29, 161, 242, 0.4)',
        zIndex: 1
    };

    const iconStyle = {
        fontSize: `${badgeSize * 0.65}px`,
        color: 'white',
        fontWeight: 'bold'
    };

    return (
        <div style={containerStyle} className={className} onClick={onClick}>
            <img
                src={src || '/user_avatar.png'}
                alt={alt}
                style={avatarStyle}
                onError={(e) => { e.target.src = '/user_avatar.png'; }}
            />
            {isVerified && (
                <div style={badgeStyle}>
                    <span className="material-icons" style={iconStyle}>
                        check
                    </span>
                </div>
            )}
        </div>
    );
};

export default VerifiedAvatar;
