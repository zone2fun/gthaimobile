import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdManager = () => {
    const location = useLocation();

    // Configuration: Set to true to show ads/placeholders
    const ENABLE_ADS = false;

    // Don't show ads on Login or Register pages if desired (optional)
    // const excludeRoutes = ['/login', '/register'];
    // if (excludeRoutes.includes(location.pathname)) return null;

    useEffect(() => {
        // This is where you would initialize AdSense if needed
        // e.g., (window.adsbygoogle = window.adsbygoogle || []).push({});
    }, [location]);

    if (!ENABLE_ADS) return null;

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
