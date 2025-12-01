import React from 'react';
import { useTranslation } from 'react-i18next';

export const ErrorModal = ({ isOpen, onClose, title, message }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                animation: 'fadeIn 0.2s ease-in'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '20px',
                    padding: '30px',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    animation: 'slideUp 0.3s ease-out',
                    border: '1px solid #333'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}
                >
                    <span className="material-icons" style={{ fontSize: '30px', color: '#f44336' }}>
                        error_outline
                    </span>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{title || t('common.error') || 'Error'}</h3>
                <p style={{ color: '#888', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#f44336',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px'
                    }}
                >
                    {t('common.close') || 'OK'}
                </button>
            </div>
        </div>
    );
};

export const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                animation: 'fadeIn 0.2s ease-in'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '20px',
                    padding: '30px',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    animation: 'slideUp 0.3s ease-out',
                    border: '1px solid #333'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}
                >
                    <span className="material-icons" style={{ fontSize: '30px', color: '#4CAF50' }}>
                        check_circle
                    </span>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{title || 'Success'}</h3>
                <p style={{ color: '#888', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px'
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
};
