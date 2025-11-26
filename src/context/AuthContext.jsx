import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // In a real app, you might validate the token with the backend here
            // For now, we'll assume if there's a token, we're logged in
            // You could decode the token to get user info if needed
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        try {
            const data = await apiLogin(username, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                setToken(data.token);
                setUser(data);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const data = await apiRegister(userData);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                setToken(data.token);
                setUser(data);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const googleLogin = async (accessToken) => {
        try {
            const data = await apiGoogleLogin(accessToken);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                setToken(data.token);
                setUser(data);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };


    return (
        <AuthContext.Provider value={{ user, setUser, token, login, register, logout, googleLogin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
