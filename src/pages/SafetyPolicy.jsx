import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

const SafetyPolicy = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                    <h1 style={styles.title}>{t('safety.title')}</h1>
                </div>

                <div style={styles.card}>
                    <p style={styles.intro}>
                        <Trans i18nKey="safety.intro" components={{ br: <br /> }} />
                    </p>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>{t('safety.sections.1.title')}</h2>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub1.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub1.text1')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub1.text2')}</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub2.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub2.text1')}</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub3.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub3.text1')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub3.text2')}</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub4.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub4.intro')}</p>
                            <ul style={styles.list}>
                                {t('safety.sections.1.sub4.list', { returnObjects: true }).map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub5.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub5.text1')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub5.text2')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub5.text3')}</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub6.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub6.text1')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub6.text2')}</p>
                            <p style={styles.text}>{t('safety.sections.1.sub6.text3')}</p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.1.sub7.title')}</h3>
                            <p style={styles.text}>{t('safety.sections.1.sub7.text1')}</p>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>{t('safety.sections.2.title')}</h2>
                        <p style={styles.text}>{t('safety.sections.2.intro')}</p>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.2.sub1.title')}</h3>
                            <p style={styles.text}>
                                <Trans
                                    i18nKey="safety.sections.2.sub1.text"
                                    components={{ 1: <span style={styles.highlight} /> }}
                                />
                            </p>
                        </div>

                        <div style={styles.subSection}>
                            <h3 style={styles.subSectionTitle}>{t('safety.sections.2.sub2.title')}</h3>
                            <p style={styles.text}>
                                <Trans
                                    i18nKey="safety.sections.2.sub2.text"
                                    components={{ 1: <span style={styles.highlight} /> }}
                                />
                            </p>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>{t('safety.sections.3.title')}</h2>
                        <p style={styles.text}>{t('safety.sections.3.text1')}</p>
                        <p style={styles.text}>{t('safety.sections.3.text2')}</p>
                        <p style={styles.text}>{t('safety.sections.3.text3')}</p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>{t('safety.sections.4.title')}</h2>
                        <p style={styles.text}>{t('safety.sections.4.text')}</p>
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
