import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import AnnouncementModal from '../components/AnnouncementModal';
import { getUsers, getFreshFaces, getUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const { t } = useTranslation();
    const [freshFaces, setFreshFaces] = useState(null);
    const [favourites, setFavourites] = useState(null);
    const [nearby, setNearby] = useState(null);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const { token, user } = useContext(AuthContext);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    // Fetch and show announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            if (!token || !user) return;

            try {
                const response = await fetch(`${API_URL}/api/announcements/active`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Failed to fetch announcements');

                const data = await response.json();

                if (data && data.length > 0) {
                    // Get hidden announcements from localStorage (Permanent opt-out)
                    const hiddenAnnouncements = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '[]');

                    // Find first announcement that hasn't been hidden permanently
                    const announcementToShow = data.find(ann => !hiddenAnnouncements.includes(ann._id));

                    if (announcementToShow) {
                        // Check if already shown in this session
                        const hasShownInSession = sessionStorage.getItem(`announcement_shown_${announcementToShow._id}`);

                        if (!hasShownInSession) {
                            setCurrentAnnouncement(announcementToShow);
                            setShowAnnouncementModal(true);
                            // Mark as shown for this session
                            sessionStorage.setItem(`announcement_shown_${announcementToShow._id}`, 'true');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching announcements:', error);
            }
        };

        fetchAnnouncements();
    }, [token, user, API_URL]);

    const handleTrackClick = async (announcementId) => {
        try {
            await fetch(`${API_URL}/api/announcements/${announcementId}/click`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    };

    const handleCloseAnnouncement = () => {
        setShowAnnouncementModal(false);
        setCurrentAnnouncement(null);
    };

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
                        {t('home.online')}
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
                        {t('home.verify')}
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

            <Section title={t('home.freshFaces')} items={filterUsers(freshFaces)} />
            {token && user && <Section title={t('home.favourites')} items={filterUsers(favourites)} />}
            <Section title={t('home.nearby')} items={filterUsers(nearby)} isGrid={true} />

            {/* Announcement Modal */}
            {showAnnouncementModal && currentAnnouncement && (
                <AnnouncementModal
                    announcement={currentAnnouncement}
                    onClose={handleCloseAnnouncement}
                    onTrackClick={handleTrackClick}
                />
            )}
        </div>
    );
};

export default Home;
