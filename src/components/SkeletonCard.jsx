import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="profile-card skeleton-card">
            <div className="skeleton-image"></div>
            <div className="profile-info">
                <div className="skeleton-dot"></div>
                <div className="skeleton-text"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
