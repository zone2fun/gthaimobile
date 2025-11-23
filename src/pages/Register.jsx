import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        age: '',
        height: '',
        weight: '',
        country: ''
    });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(formData);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Registration failed');
        }
    };

    return (
        <div className="app-content" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <h1 style={{ marginBottom: '20px' }}>Register</h1>
            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <input type="text" name="username" placeholder="Username" onChange={handleChange} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input type="password" name="password" placeholder="Password" onChange={handleChange} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input type="text" name="name" placeholder="Display Name" onChange={handleChange} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                    <input type="number" name="age" placeholder="Age" onChange={handleChange} style={inputStyle} />
                    <input type="text" name="country" placeholder="Country" onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                    <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} style={inputStyle} />
                    <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} style={inputStyle} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    Register
                </button>
            </form>
            <p style={{ marginTop: '20px', color: '#a0a0a0' }}>
                Already have an account? <Link to="/login" style={{ color: '#a607d6' }}>Login</Link>
            </p>
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
