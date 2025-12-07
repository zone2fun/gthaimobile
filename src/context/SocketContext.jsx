import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import AuthContext from './AuthContext';
import Toast from '../components/Toast';
import { getConversations } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const { user, token } = useContext(AuthContext);

    useEffect(() => {
        if (!user || !user._id) return;

        // Initialize socket synchronously
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        newSocket.emit('setup', user);
        console.log('Socket initialized and setup emitted for user:', user._id);

        // Fetch initial unread count
        const fetchUnreadCount = async () => {
            if (token) {
                try {
                    const conversations = await getConversations(token);
                    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
                    console.log('Initial total unread count:', totalUnread);
                    setUnreadCount(totalUnread);
                } catch (error) {
                    console.error('Error fetching unread count:', error);
                }
            }
        };

        fetchUnreadCount();

        // Global message listener for unread count
        newSocket.on('message received', (newMessage) => {
            console.log('Socket: Message received:', newMessage);
            const senderId = newMessage.sender._id || newMessage.sender;

            // Only increment if we are not the sender
            if (senderId !== user._id) {
                console.log(`Socket: Incrementing unread count. Sender (${senderId}) !== User (${user._id})`);
                setUnreadCount(prev => prev + 1);
            } else {
                console.log('Socket: Ignoring own message for unread count.');
            }
        });

        const setupFavoritesListener = async () => {
            try {
                // Fetch favorites
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const userData = await response.json();
                const favorites = userData.favorites || [];
                // console.log('User favorites loaded:', favorites);

                // Listen for user status changes
                newSocket.on('user status', ({ userId, isOnline, userName, userImg }) => {
                    // console.log('User status event:', { userId, isOnline, userName, userImg });

                    // Check if this user is in favorites and just came online
                    if (isOnline && favorites.includes(userId)) {
                        // console.log('✅ Favorite user came online!', userName);
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
                console.error('Error setting up socket favorites:', error);
            }
        };

        setupFavoritesListener();

        // Cleanup
        return () => {
            if (newSocket) {
                console.log('Socket: Cleaning up connection');
                newSocket.close();
                setSocket(null);
            }
        };
    }, [user, token]);

    const resetUnreadCount = () => {
        console.log('Socket: Resetting unread count');
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
