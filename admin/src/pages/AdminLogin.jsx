import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store admin data in localStorage
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify({
                    _id: data._id,
                    username: data.username,
                    email: data.email,
                    name: data.name,
                    role: data.role
                }));

                // Redirect to dashboard
                navigate('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Background Pattern */}
            <div style={styles.background} />

            {/* Overlay */}
            <div style={styles.overlay} />

            {/* Login Card */}
            <div style={styles.card}>
                <div style={styles.logoContainer}>
                    <h1 style={styles.logo}>
                        GThai <span style={{ color: '#a607d6' }}>Admin</span>
                    </h1>
                    <p style={styles.subtitle}>Admin Panel Login</p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <span className="material-icons" style={{ fontSize: '20px' }}>error</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <div style={styles.inputWrapper}>
                            <span className="material-icons" style={styles.inputIcon}>person</span>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrapper}>
                            <span className="material-icons" style={styles.inputIcon}>lock</span>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.submitBtn,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>info</span>
                        Contact administrator for access
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    background: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -2,
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: -1,
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid #333',
    },
    logoContainer: {
        textAlign: 'center',
        marginBottom: '30px',
    },
    logo: {
        fontSize: '32px',
        fontWeight: 'bold',
        margin: 0,
        marginBottom: '8px',
    },
    subtitle: {
        color: '#a0a0a0',
        fontSize: '14px',
        margin: 0,
    },
    errorBox: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        border: '1px solid #ff4444',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#ff4444',
        fontSize: '14px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#a0a0a0',
    },
    inputWrapper: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#666',
        fontSize: '20px',
    },
    input: {
        width: '100%',
        padding: '12px 12px 12px 45px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#a607d6',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        marginTop: '10px',
        transition: 'background-color 0.2s',
    },
    footer: {
        marginTop: '30px',
        textAlign: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default AdminLogin;
