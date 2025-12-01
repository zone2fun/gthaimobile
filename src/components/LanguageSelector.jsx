import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ direction = 'down' }) => {
    const { i18n, t } = useTranslation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const languages = [
        { code: 'th', name: 'ไทย', flag: '🇹🇭' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        setShowDropdown(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isMobile ? '8px' : '8px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
                <span style={{ fontSize: '18px' }}>{currentLanguage.flag}</span>
                {!isMobile && <span>{currentLanguage.name}</span>}
                <span className="material-icons" style={{ fontSize: '18px' }}>
                    {showDropdown ? (direction === 'up' ? 'expand_more' : 'expand_less') : (direction === 'up' ? 'expand_less' : 'expand_more')}
                </span>
            </button>

            {showDropdown && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998
                        }}
                        onClick={() => setShowDropdown(false)}
                    />
                    <div style={{
                        position: 'absolute',
                        top: direction === 'down' ? '100%' : 'auto',
                        bottom: direction === 'up' ? '100%' : 'auto',
                        marginTop: direction === 'down' ? '8px' : 0,
                        marginBottom: direction === 'up' ? '8px' : 0,
                        right: 0,
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                        minWidth: '150px',
                        overflow: 'hidden'
                    }}>
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 16px',
                                    backgroundColor: i18n.language === lang.code ? 'rgba(166, 7, 214, 0.1)' : 'transparent',
                                    border: 'none',
                                    color: i18n.language === lang.code ? '#a607d6' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    textAlign: 'left',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    if (i18n.language !== lang.code) {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (i18n.language !== lang.code) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                                <span>{lang.name}</span>
                                {i18n.language === lang.code && (
                                    <span className="material-icons" style={{ marginLeft: 'auto', fontSize: '18px' }}>
                                        check
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Mobile version - displays as a flat list of buttons
export const LanguageSelectorMobile = () => {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'th', name: 'ไทย', flag: '🇹🇭' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' }
    ];

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        backgroundColor: i18n.language === lang.code ? 'rgba(166, 7, 214, 0.1)' : 'transparent',
                        border: 'none',
                        color: i18n.language === lang.code ? '#a607d6' : 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (i18n.language !== lang.code) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (i18n.language !== lang.code) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {i18n.language === lang.code && (
                        <span className="material-icons" style={{ marginLeft: 'auto', fontSize: '18px' }}>
                            check
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default LanguageSelector;
