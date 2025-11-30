import React, { useState, useEffect } from 'react';

const Maintenance = () => {
    const [maintenanceConfig, setMaintenanceConfig] = useState({
        reason: 'ปิดปรับปรุงปกติ',
        expectedEndTime: null
    });
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Hide scrollbar
        document.body.style.overflow = 'hidden';

        return () => {
            // Restore scrollbar on unmount
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${API_URL}/api/settings/public`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.maintenanceConfig) {
                        setMaintenanceConfig(data.maintenanceConfig);
                    }
                }
            } catch (error) {
                console.error('Error fetching maintenance config:', error);
            }
        };

        fetchConfig();
    }, []);

    const getReasonIcon = (reason) => {
        switch (reason) {
            case 'มีเหตุขัดข้อง':
                return 'error';
            case 'ทำการ Backup ระบบ':
                return 'backup';
            default:
                return 'construction';
        }
    };

    const getReasonColor = (reason) => {
        switch (reason) {
            case 'มีเหตุขัดข้อง':
                return '#ff4444';
            case 'ทำการ Backup ระบบ':
                return '#2ecc71';
            default:
                return '#ff9800';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '60px 40px',
                maxWidth: '550px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 30px',
                    backgroundColor: getReasonColor(maintenanceConfig.reason),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <span className="material-icons" style={{ fontSize: '60px', color: 'white' }}>
                        {getReasonIcon(maintenanceConfig.reason)}
                    </span>
                </div>

                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '15px'
                }}>
                    Under Maintenance
                </h1>

                <p style={{
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '30px'
                }}>
                    We're currently performing scheduled maintenance to improve your experience.
                    We'll be back online shortly. Thank you for your patience!
                </p>

                <div style={{
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '10px',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#888',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <span className="material-icons" style={{ fontSize: '18px', color: getReasonColor(maintenanceConfig.reason) }}>
                            info
                        </span>
                        <strong style={{ color: '#333' }}>Reason:</strong>
                        <span style={{ color: getReasonColor(maintenanceConfig.reason), fontWeight: '600' }}>
                            {maintenanceConfig.reason}
                        </span>
                    </div>

                    {maintenanceConfig.expectedEndTime && (
                        <div style={{
                            fontSize: '14px',
                            color: '#888',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <span className="material-icons" style={{ fontSize: '18px', color: '#2ecc71' }}>
                                schedule
                            </span>
                            <strong style={{ color: '#333' }}>Expected to be back:</strong>
                            <span style={{ color: '#2ecc71', fontWeight: '600' }}>
                                {new Date(maintenanceConfig.expectedEndTime).toLocaleString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '14px 32px',
                        backgroundColor: '#a607d6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 15px rgba(166, 7, 214, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#8a05b8';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#a607d6';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <span className="material-icons">refresh</span>
                    Check Again
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 ${getReasonColor(maintenanceConfig.reason)}70;
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 0 20px ${getReasonColor(maintenanceConfig.reason)}00;
                    }
                }
            `}</style>
        </div>
    );
};

export default Maintenance;
