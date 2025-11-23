import React, { useState, useEffect, useContext } from 'react';
import Section from '../components/Section';
import { getUsers, getFreshFaces } from '../services/api';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const [freshFaces, setFreshFaces] = useState([]);
    const [favourites, setFavourites] = useState([]);
    const [nearby, setNearby] = useState([]);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                try {
                    // Fetch Fresh Faces (Top 20 newest)
                    const freshUsers = await getFreshFaces(token);
                    setFreshFaces(freshUsers);

                    // Fetch Nearby (All users sorted by distance)
                    const allUsers = await getUsers(token);
                    setNearby(allUsers);

                    // Filter Favourites from all users
                    setFavourites(allUsers.filter(u => u.starred).slice(0, 5));
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            }
        };
        fetchData();
    }, [token]);

    return (
        <div className="home-page">
            <Section title="Fresh Faces" items={freshFaces} />
            <Section title="Favourites" items={favourites} />
            <Section title="Nearby" items={nearby} isGrid={true} />
        </div>
    );
};

export default Home;
