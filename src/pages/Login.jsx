import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
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

    return (
        <div className="app-content" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <h1 style={{ marginBottom: '20px' }}>Login</h1>
            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Username"
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
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
            <p style={{ marginTop: '20px', color: '#a0a0a0' }}>
                Don't have an account? <Link to="/register" style={{ color: '#a607d6' }}>Register</Link>
            </p>
        </div>
    );
};

export default Login;
