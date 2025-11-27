import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Login failed');
        }
    };


    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Use access_token
                const accessToken = tokenResponse.access_token;

                // Get user's geolocation
                let lat = null;
                let lng = null;

                if (navigator.geolocation) {
                    try {
                        const position = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                timeout: 5000,
                                maximumAge: 0
                            });
                        });
                        lat = position.coords.latitude;
                        lng = position.coords.longitude;
                    } catch (geoError) {
                        console.warn('Geolocation error:', geoError);
                        // Continue without geolocation
                    }
                }

                const result = await googleLogin(accessToken, lat, lng); // Send to backend with location

                if (result.success) navigate('/');
                else setError(result.message || 'Google login failed');

            } catch (err) {
                setError('Google login failed');
            }
        },
        onError: () => setError('Google login failed')
    });



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

            <div className="app-content" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '20px', color: 'white' }}><span style={{ color: '#a607d6' }}>GthaiLover</span> Login</h1>
                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                        />
                        <div style={{ textAlign: 'right', marginTop: '8px' }}>
                            <Link to="/forgot-password" style={{ color: '#a607d6', fontSize: '14px', textDecoration: 'none' }}>
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        Login
                    </button>
                </form>

                <div style={{ width: '100%', margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }}></div>
                    <span style={{ color: '#888', fontSize: '14px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }}></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #444',
                        backgroundColor: 'white',
                        color: '#333',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                    Continue with Google
                </button>

                <p style={{ marginTop: '20px', color: '#a0a0a0' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#a607d6' }}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
