import React from 'react';
import Section from '../components/Section';
import { favourites } from '../data/users';

const Favourites = () => {
    return (
        <main className="app-content">
            <Section title="ที่คุณชอบ" users={favourites} isGrid={true} />
        </main>
    );
};

export default Favourites;
