import React from 'react';

const ApprovePhoto = () => {
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Approve Photo</h1>
            </div>

            <div style={styles.comingSoonContainer}>
                <span className="material-icons" style={styles.icon}>photo_library</span>
                <h2 style={styles.title}>Coming Soon</h2>
                <p style={styles.description}>
                    Photo approval feature is under development.
                    <br />
                    Stay tuned for updates!
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100%',
    },
    header: {
        marginBottom: '20px',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
    },
    comingSoonContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333',
        padding: '40px',
    },
    icon: {
        fontSize: '80px',
        color: '#a607d6',
        marginBottom: '20px',
    },
    title: {
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#fff',
    },
    description: {
        fontSize: '16px',
        color: '#a0a0a0',
        lineHeight: '1.6',
    },
};

export default ApprovePhoto;
