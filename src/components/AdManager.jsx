import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdUnit from './AdUnit';

const AdManager = () => {
    const location = useLocation();
    const [adsEnabled, setAdsEnabled] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Check if we are on a chat detail page
    const isChatDetailPage = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${API_URL}/api/settings/public`);
                if (response.ok) {
                    const data = await response.json();
                    setAdsEnabled(data.adsenseEnabled);
                    setMaintenanceMode(data.maintenanceMode);
                }
            } catch (error) {
                console.error('Error fetching ad settings:', error);
                setAdsEnabled(false);
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        if (adsEnabled) {
            // Initialize AdSense when ads are enabled and route changes
            // try {
            //     (window.adsbygoogle = window.adsbygoogle || []).push({});
            // } catch (e) {
            //     console.error('AdSense error:', e);
            // }
        }
    }, [location, adsEnabled]);

    if (!adsEnabled) return null;

    return (
        <>
            {/* Desktop Ads - Left & Right */}
            <div className="ad-desktop ad-left">
                <div className="ad-placeholder-vertical">
                    <AdUnit slot="7366794636" />
                </div>
            </div>

            <div className="ad-desktop ad-right">
                <div className="ad-placeholder-vertical">
                    <AdUnit slot="3772832857" />
                </div>
            </div>

            {/* Mobile Ad - Bottom Floating - Hidden on Chat Detail Page */}
            {!isChatDetailPage && (
                <div className="ad-mobile-bottom">
                    <div className="ad-placeholder-horizontal">
                        <AdUnit slot="2427961590" />
                    </div>
                </div>
            )}
        </>
    );
};

export default AdManager;
