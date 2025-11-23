import React from 'react';
import ProfileCard from './ProfileCard';

const Section = ({ title, items, isGrid = false }) => {
    return (
        <section className="user-section">
            <h2 className="section-title">{title}</h2>
            <div className={isGrid ? "grid-container" : "horizontal-scroll-container"}>
                {items && items.map((user, index) => (
                    <ProfileCard key={user._id || user.id || index} user={user} />
                ))}
            </div>
        </section>
    );
};

export default Section;
