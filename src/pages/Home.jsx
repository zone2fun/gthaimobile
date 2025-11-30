import React, { useState, useEffect, useContext } from 'react';
import Section from '../components/Section';
import { getUsers, getFreshFaces, getUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const [freshFaces, setFreshFaces] = useState(null);
    const [favourites, setFavourites] = useState(null);
    const [nearby, setNearby] = useState(null);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
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

    // Filter users based on online status and verification status
    const filterUsers = (users) => {
        if (!users) return users;
        let filtered = users;
        if (showOnlineOnly) {
            filtered = filtered.filter(u => u.isOnline);
        }
        if (showVerifiedOnly) {
            filtered = filtered.filter(u => u.isVerified);
        }
        return filtered;
    };

    return (
        <div className="home-page">
            {/* Filter Toggles */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '10px 15px',
                gap: '15px'
            }}>
                {/* Online Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '14px',
                        color: showOnlineOnly ? 'var(--online-color)' : 'var(--secondary-text)',
                        fontWeight: '500',
                        transition: 'color 0.3s'
                    }}>
                        Online
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

                {/* Verified Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '14px',
                        color: showVerifiedOnly ? '#1DA1F2' : 'var(--secondary-text)',
                        fontWeight: '500',
                        transition: 'color 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        Verify
                        {showVerifiedOnly && <span className="material-icons" style={{ fontSize: '14px' }}>verified</span>}
                    </span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showVerifiedOnly}
                            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <Section title="Fresh Faces" items={filterUsers(freshFaces)} />
            {token && user && <Section title="Favourites" items={filterUsers(favourites)} />}
            <Section title="Nearby" items={filterUsers(nearby)} isGrid={true} />
        </div>
    );
};

export default Home;
