import React from 'react';

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease-out'
    },
    modal: {
        backgroundColor: '#1e1e1e',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '400px',
        padding: '0',
        border: '1px solid #333',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        transform: 'scale(1)',
        animation: 'scaleIn 0.2s ease-out',
        overflow: 'hidden'
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    icon: {
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '600',
        color: '#fff'
    },
    body: {
        padding: '24px',
        color: '#ccc',
        fontSize: '15px',
        lineHeight: '1.5'
    },
    footer: {
        padding: '16px 24px',
        backgroundColor: '#252525',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        borderTop: '1px solid #2a2a2a'
    },
    button: {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    cancelBtn: {
        backgroundColor: 'transparent',
        color: '#aaa',
        border: '1px solid #444'
    },
    confirmBtn: {
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const isDanger = type === 'danger';
    const iconColor = isDanger ? '#ff4444' : '#a607d6';
    const iconBg = isDanger ? 'rgba(255, 68, 68, 0.1)' : 'rgba(166, 7, 214, 0.1)';
    const iconName = isDanger ? 'warning' : 'help';

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <div style={{ ...modalStyles.icon, backgroundColor: iconBg, color: iconColor }}>
                        <span className="material-icons">{iconName}</span>
                    </div>
                    <h3 style={modalStyles.title}>{title}</h3>
                </div>
                <div style={modalStyles.body}>
                    {message}
                </div>
                <div style={modalStyles.footer}>
                    <button
                        style={{ ...modalStyles.button, ...modalStyles.cancelBtn }}
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        style={{
                            ...modalStyles.button,
                            ...modalStyles.confirmBtn,
                            backgroundColor: iconColor
                        }}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AlertModal = ({ isOpen, onClose, title, message, type = 'success', buttonText = 'OK' }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const iconColor = isSuccess ? '#2ecc71' : '#ff4444';
    const iconBg = isSuccess ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 68, 68, 0.1)';
    const iconName = isSuccess ? 'check_circle' : 'error';

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <div style={{ ...modalStyles.icon, backgroundColor: iconBg, color: iconColor }}>
                        <span className="material-icons">{iconName}</span>
                    </div>
                    <h3 style={modalStyles.title}>{title}</h3>
                </div>
                <div style={modalStyles.body}>
                    {message}
                </div>
                <div style={modalStyles.footer}>
                    <button
                        style={{
                            ...modalStyles.button,
                            ...modalStyles.confirmBtn,
                            backgroundColor: iconColor,
                            width: '100%'
                        }}
                        onClick={onClose}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
