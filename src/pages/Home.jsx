import React from 'react';
import Section from '../components/Section';
import { freshFaces, favourites, nearby } from '../data/users';

const Home = () => {
    return (
        <main className="app-content">
            <Section title="มาใหม่" users={freshFaces} />
            <Section title="ที่คุณชอบ" users={favourites} />
            <Section title="ใกล้กัน" users={nearby} isGrid={true} />
        </main>
    );
};

export default Home;
