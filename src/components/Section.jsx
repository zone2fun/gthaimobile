import React, { useRef, useState } from 'react';
import ProfileCard from './ProfileCard';
import SkeletonCard from './SkeletonCard';

const Section = ({ title, items, isGrid = false }) => {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        if (isGrid) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || isGrid) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const scrollLeftBtn = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRightBtn = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    // Show skeleton loading if items is null
    const isLoading = items === null;
    const skeletonCount = isGrid ? 12 : 6;

    return (
        <section className="user-section">
            <h2 className="section-title">{title}</h2>
            <div style={{ position: 'relative' }}>
                {!isGrid && items && items.length > 0 && (
                    <>
                        <button
                            onClick={scrollLeftBtn}
                            className="scroll-arrow scroll-arrow-left"
                            style={{
                                position: 'absolute',
                                left: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                background: 'rgba(0, 0, 0, 0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}
                        >
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <button
                            onClick={scrollRightBtn}
                            className="scroll-arrow scroll-arrow-right"
                            style={{
                                position: 'absolute',
                                right: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                background: 'rgba(0, 0, 0, 0.7)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}
                        >
                            <span className="material-icons">chevron_right</span>
                        </button>
                    </>
                )}
                <div
                    ref={scrollRef}
                    className={isGrid ? "grid-container" : "horizontal-scroll-container"}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={!isGrid ? { cursor: isDragging ? 'grabbing' : 'grab' } : {}}
                >
                    {isLoading ? (
                        // Show skeleton cards while loading
                        Array.from({ length: skeletonCount }).map((_, index) => (
                            <SkeletonCard key={`skeleton-${index}`} />
                        ))
                    ) : (
                        // Show actual user cards
                        items && items.map((user, index) => (
                            <ProfileCard key={user._id || user.id || index} user={user} />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default Section;
