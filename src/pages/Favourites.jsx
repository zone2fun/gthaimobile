import React, { useState, useEffect, useContext } from 'react';
import ProfileCard from '../components/ProfileCard';
import { getUsers } from '../services/api';
import AuthContext from '../context/AuthContext';

const Favourites = () => {
    const [favourites, setFavourites] = useState([]);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                try {
                    const users = await getUsers(token);
                    setFavourites(users.filter(u => u.starred));
                } catch (error) {
                    console.error("Error fetching favourites:", error);
                }
            }
        };
        fetchData();
    }, [token]);

    return (
        <div className="app-content">
            <h2 className="section-title">Favourites</h2>
            <div className="grid-container">
                {favourites.map(user => (
                    <ProfileCard key={user.id || user._id} user={user} />
                ))}
            </div>
        </div>
    );
};

export default Favourites;
