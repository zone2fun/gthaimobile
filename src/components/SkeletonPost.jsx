import React from 'react';

const SkeletonPost = () => {
    return (
        <div className="post-card">
            {/* Post Header Skeleton */}
            <div className="post-header">
                <div className="post-author-info" style={{ pointerEvents: 'none' }}>
                    <div className="post-avatar-wrapper">
                        <div
                            className="post-avatar"
                            style={{
                                background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                width: '120px',
                                height: '16px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                                marginBottom: '6px'
                            }}
                        />
                        <div
                            style={{
                                width: '80px',
                                height: '12px',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Post Content Skeleton */}
            <div className="post-content">
                <div style={{ marginBottom: '12px' }}>
                    <div
                        style={{
                            width: '100%',
                            height: '14px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            marginBottom: '8px'
                        }}
                    />
                    <div
                        style={{
                            width: '90%',
                            height: '14px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            marginBottom: '8px'
                        }}
                    />
                    <div
                        style={{
                            width: '70%',
                            height: '14px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }}
                    />
                </div>

                {/* Image Skeleton */}
                <div
                    className="post-image-container"
                    style={{
                        background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        height: '250px',
                        borderRadius: '8px'
                    }}
                />
            </div>

            {/* Post Stats Skeleton */}
            <div className="post-stats">
                <div className="post-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '60px',
                            height: '12px',
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }}
                    />
                </div>
            </div>

            {/* Post Actions Skeleton */}
            <div className="post-actions">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="post-action-btn"
                        style={{
                            background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            pointerEvents: 'none',
                            height: '36px',
                            borderRadius: '8px'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default SkeletonPost;
