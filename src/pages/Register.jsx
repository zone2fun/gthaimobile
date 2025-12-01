import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [locationStatus, setLocationStatus] = useState('Acquiring location...');
    const [showAgeModal, setShowAgeModal] = useState(true);
    const [ageVerified, setAgeVerified] = useState(false);
    const { register } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleAgeAccept = () => {
        setAgeVerified(true);
        setShowAgeModal(false);
    };

    const handleAgeDecline = () => {
        setShowAgeModal(false);
        navigate('/login');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                    setLocationStatus(`${t('auth.location.found')} ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationStatus(t('auth.location.failed'));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationStatus(t('auth.location.notSupported'));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.username.length < 8) {
            setError(t('auth.errors.usernameMin'));
            return;
        }
        if (formData.password.length < 8) {
            setError(t('auth.errors.passwordMin'));
            return;
        }
        if (formData.name.length < 3) {
            setError(t('auth.errors.nameMin'));
            return;
        }
        if (!formData.email || !formData.email.includes('@')) {
            setError(t('auth.errors.invalidEmail'));
            return;
        }

        const result = await register(formData);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || t('auth.errors.registrationFailed'));
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            margin: 0,
            padding: 0
        }}>
            {/* Background Image Layer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url("/bg.png")',
                backgroundRepeat: 'repeat',
                backgroundSize: '300px',
                zIndex: -2
            }} />

            {/* Overlay Layer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: -1
            }} />

            {/* Age Verification Modal */}
            {showAgeModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-in-out',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(166, 7, 214, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid rgba(166, 7, 214, 0.3)',
                        borderRadius: '20px',
                        padding: '40px',
                        maxWidth: '450px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(166, 7, 214, 0.3), 0 0 40px rgba(166, 7, 214, 0.1)',
                        animation: 'slideUp 0.4s ease-out',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative gradient orb */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '-50px',
                            width: '150px',
                            height: '150px',
                            background: 'radial-gradient(circle, rgba(166, 7, 214, 0.4) 0%, transparent 70%)',
                            borderRadius: '50%',
                            filter: 'blur(40px)',
                            pointerEvents: 'none'
                        }} />

                        {/* Warning Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            background: 'linear-gradient(135deg, #a607d6 0%, #d607a6 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            boxShadow: '0 10px 30px rgba(166, 7, 214, 0.4)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            ⚠️
                        </div>

                        <h2 style={{
                            color: 'white',
                            textAlign: 'center',
                            marginBottom: '15px',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #ffffff 0%, #a607d6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {t('auth.ageVerification.title')}
                        </h2>

                        <p style={{
                            color: '#e0e0e0',
                            textAlign: 'center',
                            marginBottom: '10px',
                            fontSize: '16px',
                            lineHeight: '1.6'
                        }}>
                            {t('auth.ageVerification.content1')}
                        </p>

                        <p style={{
                            color: '#a607d6',
                            textAlign: 'center',
                            marginBottom: '30px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textShadow: '0 0 20px rgba(166, 7, 214, 0.5)'
                        }}>
                            {t('auth.ageVerification.content2')}
                        </p>

                        <p style={{
                            color: '#b0b0b0',
                            textAlign: 'center',
                            marginBottom: '30px',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}>
                            {t('auth.ageVerification.content3')}
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            marginTop: '30px'
                        }}>
                            <button
                                onClick={handleAgeAccept}
                                style={{
                                    flex: 1,
                                    padding: '15px 30px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    background: 'linear-gradient(135deg, #a607d6 0%, #d607a6 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 5px 20px rgba(166, 7, 214, 0.4)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 30px rgba(166, 7, 214, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 5px 20px rgba(166, 7, 214, 0.4)';
                                }}
                            >
                                ✓ {t('auth.ageVerification.accept')}
                            </button>

                            <button
                                onClick={handleAgeDecline}
                                style={{
                                    flex: 1,
                                    padding: '15px 30px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#e0e0e0',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                ✗ {t('auth.ageVerification.decline')}
                            </button>
                        </div>
                    </div>

                    <style>
                        {`
                            @keyframes fadeIn {
                                from {
                                    opacity: 0;
                                }
                                to {
                                    opacity: 1;
                                }
                            }

                            @keyframes slideUp {
                                from {
                                    transform: translateY(30px);
                                    opacity: 0;
                                }
                                to {
                                    transform: translateY(0);
                                    opacity: 1;
                                }
                            }

                            @keyframes pulse {
                                0%, 100% {
                                    transform: scale(1);
                                }
                                50% {
                                    transform: scale(1.05);
                                }
                            }
                        `}
                    </style>
                </div>
            )}

            <div className="app-content" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '20px', color: 'white' }}>{t('auth.registerTitle')}</h1>
                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            name="username"
                            placeholder={t('auth.username') + " (min 8 chars)"}
                            onChange={handleChange}
                            style={inputStyle}
                            minLength="8"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="password"
                            name="password"
                            placeholder={t('auth.password') + " (min 8 chars)"}
                            onChange={handleChange}
                            style={inputStyle}
                            minLength="8"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="email"
                            name="email"
                            placeholder={t('auth.email')}
                            onChange={handleChange}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            name="name"
                            placeholder={t('auth.name') + " (min 3 chars)"}
                            onChange={handleChange}
                            style={inputStyle}
                            minLength="3"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px', color: '#ccc', fontSize: '12px', textAlign: 'center' }}>
                        {locationStatus}
                    </div>
                    <button
                        type="submit"
                        disabled={!ageVerified}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: ageVerified ? '#a607d6' : '#555',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: ageVerified ? 'pointer' : 'not-allowed',
                            opacity: ageVerified ? 1 : 0.5,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {ageVerified ? t('auth.registerTitle') : t('auth.ageVerification.verifyFirst')}
                    </button>
                    <p style={{ marginTop: '15px', color: '#a0a0a0', fontSize: '12px', textAlign: 'center' }}>
                        {t('auth.agreePolicy')} <Link to="/safety-policy" target="_blank" style={{ color: '#a607d6', textDecoration: 'underline' }}>{t('profile.safetyPolicy')}</Link>
                    </p>
                </form>
                <p style={{ marginTop: '20px', color: '#a0a0a0' }}>
                    {t('auth.alreadyHaveAccount')} <Link to="/login" style={{ color: '#a607d6' }}>{t('auth.loginTitle')}</Link>
                </p>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '20px',
                zIndex: 10
            }}>
                <LanguageSelector direction="up" />
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#333',
    color: 'white'
};

export default Register;
