import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlockedUsers, unblockUser } from '../services/api';
import AuthContext from '../context/AuthContext';

const BlockList = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                const users = await getBlockedUsers(token);
                setBlockedUsers(users);
            } catch (error) {
                console.error('Error fetching blocked users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchBlockedUsers();
        }
    }, [token]);

    const handleUnblock = async (userId) => {
        try {
            await unblockUser(userId, token);
            setBlockedUsers(blockedUsers.filter(user => user._id !== userId));
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };

    const handleViewProfile = (userId) => {
        navigate(`/user/${userId}`);
    };

    if (loading) {
        return <div className="app-content" style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div className="app-content" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}
                >
                    <span className="material-icons" style={{ color: 'white', fontSize: '28px' }}>arrow_back</span>
                </button>
                <h1 style={{ margin: 0 }}>Blocked Users</h1>
            </div>

            {blockedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
                    <span className="material-icons" style={{ fontSize: '64px', marginBottom: '10px' }}>block</span>
                    <p>No blocked users</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {blockedUsers.map(user => (
                        <div
                            key={user._id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '15px',
                                background: '#1a1a1a',
                                borderRadius: '8px',
                                gap: '15px'
                            }}
                        >
                            <img
                                src={user.img || '/user_avatar.png'}
                                alt={user.name}
                                onClick={() => handleViewProfile(user._id)}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                }}
                            />
                            <div
                                style={{ flex: 1, cursor: 'pointer' }}
                                onClick={() => handleViewProfile(user._id)}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.name}</div>
                                <div style={{ color: '#888', fontSize: '14px' }}>@{user.username}</div>
                            </div>
                            <button
                                onClick={() => handleUnblock(user._id)}
                                style={{
                                    padding: '8px 20px',
                                    background: '#a607d6',
                                    border: 'none',
                                    borderRadius: '20px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Unblock
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockList;
