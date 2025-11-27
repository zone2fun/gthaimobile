import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [locationStatus, setLocationStatus] = useState('Acquiring location...');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

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
                    setLocationStatus(`Location found: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationStatus('Location failed. Using random default.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('Geolocation not supported.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.username.length < 8) {
            setError('Username must be at least 8 characters');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (formData.name.length < 3) {
            setError('Display name must be at least 3 characters');
            return;
        }
        if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        const result = await register(formData);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Registration failed');
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

            <div className="app-content" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '20px', color: 'white' }}>Register</h1>
                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username (min 8 characters)"
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
                            placeholder="Password (min 8 characters)"
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
                            placeholder="Email"
                            onChange={handleChange}
                            style={inputStyle}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Display Name (min 3 characters)"
                            onChange={handleChange}
                            style={inputStyle}
                            minLength="3"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px', color: '#ccc', fontSize: '12px', textAlign: 'center' }}>
                        {locationStatus}
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        Register
                    </button>
                </form>
                <p style={{ marginTop: '20px', color: '#a0a0a0' }}>
                    Already have an account? <Link to="/login" style={{ color: '#a607d6' }}>Login</Link>
                </p>
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
