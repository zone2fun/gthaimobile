import React from 'react';

const Settings = () => {
    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>System Settings</h1>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                border: '1px solid #333',
                textAlign: 'center'
            }}>
                <span className="material-icons" style={{ fontSize: '64px', color: '#a607d6', marginBottom: '20px' }}>
                    settings
                </span>
                <p style={{ color: '#a0a0a0', fontSize: '16px' }}>System settings features coming soon...</p>
            </div>
        </div>
    );
};

export default Settings;
