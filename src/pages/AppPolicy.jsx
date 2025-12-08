import React from 'react';

const AppPolicy = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.header}>
                    <span className="material-icons" style={styles.icon}>policy</span>
                    <h1 style={styles.title}>App Policy for Google Play Store</h1>
                </div>

                <div style={styles.card}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Privacy Policy</h2>
                        <p style={styles.text}>
                            We value your privacy and are committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.
                        </p>
                        <h3 style={styles.subSectionTitle}>Data Collection</h3>
                        <p style={styles.text}>
                            We collect the following personal information to provide our services:
                        </p>
                        <ul style={styles.list}>
                            <li>Name and Email Address (for account creation)</li>
                            <li>Profile Information (Age, Height, Weight, Photos)</li>
                            <li>Approximate Location (to show nearby users, optional)</li>
                            <li>User Content (Posts, Comments, Messages)</li>
                        </ul>

                        <h3 style={styles.subSectionTitle}>How We Use Your Data</h3>
                        <p style={styles.text}>
                            Your data is used to:
                        </p>
                        <ul style={styles.list}>
                            <li>Create and manage your account</li>
                            <li>Connect you with other users</li>
                            <li>Facilitate communication (chat, comments)</li>
                            <li>Ensure community safety and moderation</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Account Deletion</h2>
                        <p style={styles.text}>
                            We respect your right to control your data. If you wish to delete your account and all associated data, you can do so directly within the app:
                        </p>
                        <ol style={styles.list}>
                            <li>Go to your <strong>Profile</strong> page.</li>
                            <li>Tap on <strong>Edit Profile</strong>.</li>
                            <li>Scroll down to the bottom and select <strong>Delete Account</strong>.</li>
                            <li>Confirm your choice.</li>
                        </ol>
                        <p style={styles.text}>
                            Once confirmed, your account and all personal data will be permanently deleted from our servers immediately.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>User Content Policy</h2>
                        <p style={styles.text}>
                            Our app prohibits the following content:
                        </p>
                        <ul style={styles.list}>
                            <li>Harassment or hate speech</li>
                            <li>Illegal activities or goods</li>
                            <li>Impersonation</li>
                        </ul>
                        <p style={styles.text}>
                            We enforce strict moderation. Violations may result in content removal or account bans.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Child Sexual Abuse and Exploitation (CSAE)</h2>
                        <p style={styles.text}><strong style={{ color: '#ff4444' }}>ZERO TOLERANCE POLICY</strong></p>
                        <p style={styles.text}>
                            We have a strict, zero-tolerance policy regarding any content that depicts, promotes, or facilitates Child Sexual Abuse and Exploitation (CSAE).
                        </p>
                        <p style={styles.text}>
                            This includes, but is not limited to:
                        </p>
                        <ul style={styles.list}>
                            <li>Any visual depiction of a minor engaged in sexual acts or in a sexually suggestive manner.</li>
                            <li>Solicitation or grooming of minors for sexual purposes.</li>
                            <li>Textual descriptions of sexual acts involving minors.</li>
                            <li>Distribution or links to CSAM (Child Sexual Abuse Material).</li>
                        </ul>
                        <p style={styles.text}>
                            <strong>Our Response to Violations:</strong>
                        </p>
                        <ul style={styles.list}>
                            <li><strong>Immediate Removal:</strong> Any confirmed CSAE content will be removed immediately.</li>
                            <li><strong>Permanent Ban:</strong> Accounts involved in uploading or sharing CSAE will be permanently banned without warning.</li>
                            <li><strong>Reporting to Authorities:</strong> We will report any instances of CSAE to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement agencies, including user IP addresses and account details as required by law.</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Contact Us</h2>
                        <p style={styles.text}>
                            If you have any questions about this policy, please contact our support team.
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
        fontFamily: "'Inter', sans-serif"
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
    section: {
        marginBottom: '30px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#a607d6',
        marginBottom: '15px',
        borderLeft: '4px solid #a607d6',
        paddingLeft: '10px',
    },
    subSectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '10px',
        marginTop: '15px',
    },
    text: {
        fontSize: '14px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '10px',
    },
    list: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        color: '#ccc',
        marginBottom: '10px',
        lineHeight: '1.6',
    },
    highlight: {
        color: '#ff4444',
        fontWeight: 'bold',
    }
};

export default AppPolicy;
