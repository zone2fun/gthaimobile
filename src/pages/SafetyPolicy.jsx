import React from 'react';
import { useNavigate } from 'react-router-dom';

const SafetyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.header}>
                    <button
                        onClick={() => navigate(-1)}
                        style={styles.backBtn}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <span className="material-icons" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                    <span className="material-icons" style={styles.icon}>security</span>
                    <h1 style={styles.title}>Community & Safety Policy</h1>
                </div>

                <div style={styles.card}>
                    <p style={styles.intro}>
                        To keep GThaiLover safe and enjoyable for everyone, all users must follow the rules below.<br />
                        By using our platform, you agree to all items in this policy.
                    </p>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>1. Prohibited Content & Behavior</h2>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.1 Sexual or Explicit Content</h3>
                            <p style={styles.text}>No pornographic, sexually explicit, or indecent content of any kind.</p>
                            <p style={styles.text}>No sharing, requesting, or discussing explicit acts.</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.2 Drugs & Illegal Substances</h3>
                            <p style={styles.text}>No content promoting, selling, or requesting illegal drugs or substances.</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.3 Under 18 is Strictly Prohibited</h3>
                            <p style={styles.text}>No profiles, photos, or content involving anyone under 18.</p>
                            <p style={styles.text}>Do not claim to be under 18.</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.4 Personal Sensitive Information</h3>
                            <p style={styles.text}>Do not share or request:</p>
                            <ul style={styles.list}>
                                <li>Credit card information</li>
                                <li>Bank account details</li>
                                <li>Passwords or login credentials</li>
                                <li>Government ID numbers</li>
                                <li>Any private or sensitive information</li>
                            </ul>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.5 Impersonation & Using Other People’s Photos</h3>
                            <p style={styles.text}>Do not use photos of someone else.</p>
                            <p style={styles.text}>Do not impersonate any person or pretend to be another real individual.</p>
                            <p style={styles.text}>AI-generated looks-alike photos of real people without permission are not allowed.</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.6 Financial Scams / Investment / Gambling</h3>
                            <p style={styles.text}>No promoting investment schemes, financial help, or money transfers.</p>
                            <p style={styles.text}>No gambling or betting activities.</p>
                            <p style={styles.text}>No encouraging users to invest, donate, or send money.</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>1.7 Illegal Activities</h3>
                            <p style={styles.text}>Any illegal activity under any applicable laws is strictly prohibited.</p>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>2. Warning & Ban Policy</h2>
                        <p style={styles.text}>To keep the community safe:</p>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>2.1 General Violations</h3>
                            <p style={styles.text}>
                                If a user receives <span style={styles.highlight}>3 warnings</span> and does not correct the issue,
                                the account will be automatically banned.
                            </p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>2.2 Wrong / Prohibited Photos</h3>
                            <p style={styles.text}>
                                If a user receives <span style={styles.highlight}>10 photo-related warnings</span> (feed or profile),
                                the account will be automatically banned.
                            </p>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>3. Legal Responsibility</h2>
                        <p style={styles.text}>GThaiLover does not participate in or support any illegal actions performed by users.</p>
                        <p style={styles.text}>Any illegal behavior done through the platform is the sole responsibility of the user.</p>
                        <p style={styles.text}>By using GThaiLover, users confirm and accept this responsibility.</p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>4. Agreement</h2>
                        <p style={styles.text}>
                            By creating an account or using GThaiLover, you agree to follow all rules above.
                            Violations may result in warnings, content removal, and permanent account ban.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: '80px', // Space for bottom nav
    },
    content: {
        maxWidth: '800px',
        width: '100%',
        marginTop: '20px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #333',
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        marginRight: '5px',
    },
    icon: {
        fontSize: '40px',
        color: '#a607d6',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        margin: 0,
        background: 'linear-gradient(45deg, #fff, #ccc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid #333',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    intro: {
        fontSize: '16px',
        color: '#e0e0e0',
        marginBottom: '30px',
        lineHeight: '1.6',
        textAlign: 'center',
        fontStyle: 'italic',
        borderBottom: '1px solid #333',
        paddingBottom: '20px',
    },
    section: {
        marginBottom: '30px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#a607d6',
        marginBottom: '20px',
        borderLeft: '4px solid #a607d6',
        paddingLeft: '10px',
    },
    subSection: {
        marginBottom: '20px',
        paddingLeft: '15px',
    },
    subSectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '10px',
    },
    text: {
        fontSize: '14px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '8px',
    },
    list: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        color: '#ccc',
        marginBottom: '10px',
    },
    highlight: {
        color: '#ff4444',
        fontWeight: 'bold',
    }
};

export default SafetyPolicy;
