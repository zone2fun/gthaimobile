import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AdManager = () => {
    const location = useLocation();
    const [adsEnabled, setAdsEnabled] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                    <span>AdSpace (Left)</span>
                    {/* Paste your AdSense code here */}
                    {/* <ins className="adsbygoogle" ... ></ins> */}
                </div>
            </div>

            <div className="ad-desktop ad-right">
                <div className="ad-placeholder-vertical">
                    <span>AdSpace (Right)</span>
                    {/* Paste your AdSense code here */}
                    {/* <ins className="adsbygoogle" ... ></ins> */}
                </div>
            </div>

            {/* Mobile Ad - Bottom Floating */}
            <div className="ad-mobile-bottom">
                <div className="ad-placeholder-horizontal">
                    <span>AdSpace (Mobile)</span>
                    {/* Paste your AdSense code here */}
                    {/* <ins className="adsbygoogle" ... ></ins> */}
                </div>
            </div>
        </>
    );
};

export default AdManager;
