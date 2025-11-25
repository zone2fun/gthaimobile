import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import UserProfile from './UserProfile';

const Profile = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return <UserProfile userId={user._id || user.id} />;
};

export default Profile;
