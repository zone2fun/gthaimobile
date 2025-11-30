import React from 'react';

const VerificationModal = ({ isOpen, onClose, type = 'success', title, message }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            default:
                return 'info';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return '#2ecc71';
            case 'error':
                return '#e74c3c';
            case 'warning':
                return '#f39c12';
            case 'info':
                return '#3498db';
            default:
                return '#3498db';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                animation: 'modalSlideIn 0.3s ease-out',
                border: `1px solid ${getColor()}20`
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: `${getColor()}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <span className="material-icons" style={{
                            fontSize: '32px',
                            color: getColor()
                        }}>
                            {getIcon()}
                        </span>
                    </div>

                    <h3 style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        margin: 0
                    }}>
                        {title}
                    </h3>

                    <p style={{
                        color: '#a0a0a0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        marginBottom: '25px',
                        margin: '0 0 25px 0'
                    }}>
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            backgroundColor: getColor(),
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: `0 4px 12px ${getColor()}40`
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = `0 6px 16px ${getColor()}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 4px 12px ${getColor()}40`;
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default VerificationModal;
