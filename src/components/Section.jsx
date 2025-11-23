import React from 'react';
import ProfileCard from './ProfileCard';

const Section = ({ title, users, isGrid = false }) => {
    return (
        <section className="user-section">
            <h2 className="section-title">{title}</h2>
            <div className={isGrid ? "grid-container" : "horizontal-scroll-container"}>
                {users.map((user, index) => (
                    <ProfileCard key={index} user={user} />
                ))}
            </div>
        </section>
    );
};

export default Section;
