import React, { useState, useEffect, useContext } from 'react';
import Section from '../components/Section';
import { getUsers, getFreshFaces, getUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const [freshFaces, setFreshFaces] = useState(null);
    const [favourites, setFavourites] = useState(null);
    const [nearby, setNearby] = useState(null);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const { token, user } = useContext(AuthContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Fresh Faces
                const freshUsers = await getFreshFaces(token);
                setFreshFaces(freshUsers);

                // Fetch Nearby
                const allUsers = await getUsers(token);
                setNearby(allUsers);

                // Fetch Current User to get Favorites only if logged in
                if (token && user) {
                    const currentUserProfile = await getUser(user._id, token);

                    if (currentUserProfile && currentUserProfile.favorites) {
                        const favs = allUsers.filter(u => currentUserProfile.favorites.includes(u._id || u.id));
                        setFavourites(favs);
                    }
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchData();
    }, [token, user]);

    // Filter users based on online status
    const filterOnline = (users) => {
        if (!showOnlineOnly || !users) return users;
        return users.filter(u => u.isOnline);
    };

    return (
        <div className="home-page">
            {/* Online Filter Toggle */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '10px 15px',
                gap: '10px'
            }}>
                <span style={{
                    fontSize: '14px',
                    color: showOnlineOnly ? 'var(--online-color)' : 'var(--secondary-text)',
                    fontWeight: '500',
                    transition: 'color 0.3s'
                }}>
                    Online Only
                </span>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={showOnlineOnly}
                        onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            <Section title="Fresh Faces" items={filterOnline(freshFaces)} />
            {token && user && <Section title="Favourites" items={filterOnline(favourites)} />}
            <Section title="Nearby" items={filterOnline(nearby)} isGrid={true} />
        </div>
    );
};

export default Home;
