import React from 'react';

const Reports = () => {
    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Reports</h1>
            </div>

            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                minHeight: '300px'
            }}>
                <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>
                    construction
                </span>
                <p style={{ fontSize: '16px' }}>This page is currently under construction.</p>
            </div>
        </div>
    );
};

export default Reports;
