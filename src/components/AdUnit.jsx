import React, { useEffect } from 'react';

const AdUnit = ({ slot }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9202394633228299"
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    );
};

export default AdUnit;
