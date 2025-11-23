import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import AuthContext from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            // Connect to backend
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);

            newSocket.emit('setup', user);

            newSocket.on('message received', (newMessage) => {
                // Only increment if we are not the sender
                if (newMessage.sender._id !== user._id) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    const resetUnreadCount = () => {
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{ socket, unreadCount, resetUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
