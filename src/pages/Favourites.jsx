import React, { useState, useEffect, useContext } from 'react';
import ProfileCard from '../components/ProfileCard';
import { getUsers, getUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const Favourites = () => {
    const [favourites, setFavourites] = useState([]);
    const { token, user } = useContext(AuthContext);

    useEffect(() => {
        const fetchData = async () => {
            if (token && user) {
                try {
                    const allUsers = await getUsers(token);
                    const currentUserProfile = await getUser(user._id, token);

                    if (currentUserProfile && currentUserProfile.favorites) {
                        const favs = allUsers.filter(u => currentUserProfile.favorites.includes(u._id || u.id));
                        setFavourites(favs);
                    }
                } catch (error) {
                    console.error("Error fetching favourites:", error);
                }
            }
        };
        fetchData();
    }, [token, user]);

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
