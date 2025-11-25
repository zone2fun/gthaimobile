import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import AuthContext from './AuthContext';
import Toast from '../components/Toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const setupSocketWithFavorites = async () => {
            if (user && user._id) {
                try {
                    // First, fetch user favorites
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    });
                    const userData = await response.json();
                    const favorites = userData.favorites || [];
                    console.log('User favorites loaded:', favorites);

                    // Then, setup socket connection
                    const newSocket = io(import.meta.env.VITE_API_URL);
                    setSocket(newSocket);

                    newSocket.emit('setup', user);

                    newSocket.on('message received', (newMessage) => {
                        // Only increment if we are not the sender
                        if (newMessage.sender._id !== user._id) {
                            setUnreadCount(prev => prev + 1);
                        }
                    });

                    // Listen for user status changes
                    newSocket.on('user status', ({ userId, isOnline, userName, userImg }) => {
                        console.log('User status event:', { userId, isOnline, userName, userImg });
                        console.log('Checking against favorites:', favorites);

                        // Check if this user is in favorites and just came online
                        if (isOnline && favorites.includes(userId)) {
                            console.log('✅ Favorite user came online!', userName);
                            // Show toast notification
                            const toastId = Date.now();
                            setToasts(prev => [...prev, {
                                id: toastId,
                                message: `${userName} is now online`,
                                avatar: userImg
                            }]);
                        }
                    });

                } catch (error) {
                    console.error('Error setting up socket:', error);
                }
            }
        };

        setupSocketWithFavorites();

        // Cleanup
        return () => {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        };
    }, [user]);

    const resetUnreadCount = () => {
        setUnreadCount(0);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const disconnectSocket = () => {
        if (socket) {
            socket.close();
            setSocket(null);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, unreadCount, resetUnreadCount, disconnectSocket }}>
            {children}
            {/* Render toast notifications */}
            <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        avatar={toast.avatar}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </SocketContext.Provider>
    );
};

export default SocketContext;
