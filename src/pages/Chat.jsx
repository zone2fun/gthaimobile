import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const { token, user: currentUser } = useContext(AuthContext);
    const { socket, resetUnreadCount } = useContext(SocketContext);
    const navigate = useNavigate();

    useEffect(() => {
        resetUnreadCount();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                try {
                    const data = await getConversations(token);
                    setConversations(data);
                } catch (error) {
                    console.error("Error fetching conversations:", error);
                }
            }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessage) => {
            setConversations((prev) => {
                const otherUserId = newMessage.sender._id === currentUser._id
                    ? newMessage.recipient._id
                    : newMessage.sender._id;

                const existingConvIndex = prev.findIndex(c => c.user._id === otherUserId);

                let newConvs = [...prev];
                if (existingConvIndex !== -1) {
                    // Update existing conversation
                    const updatedConv = {
                        ...newConvs[existingConvIndex],
                        lastMessage: newMessage,
                        unreadCount: newMessage.sender._id !== currentUser._id
                            ? (newConvs[existingConvIndex].unreadCount || 0) + 1
                            : newConvs[existingConvIndex].unreadCount
                    };
                    // Move to top
                    newConvs.splice(existingConvIndex, 1);
                    newConvs.unshift(updatedConv);
                } else {
                    // Add new conversation
                    const otherUser = newMessage.sender._id === currentUser._id ? newMessage.recipient : newMessage.sender;
                    newConvs.unshift({
                        user: otherUser,
                        lastMessage: newMessage,
                        unreadCount: newMessage.sender._id !== currentUser._id ? 1 : 0
                    });
                }
                return newConvs;
            });
        };

        socket.on('message received', handleMessageReceived);

        return () => {
            socket.off('message received', handleMessageReceived);
        };
    }, [socket, currentUser]);

    return (
        <div className="app-content">
            <h2 className="section-title">แชท</h2>
            <div className="chat-list">
                {conversations.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#a0a0a0' }}>
                        <p>ยังไม่มีข้อความ</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div key={conv.user._id} className="chat-list-item" onClick={() => navigate(`/chat/${conv.user._id}`)}>
                            <div className="chat-avatar">
                                <img src={conv.user.img} alt={conv.user.name} />
                                <div className={`status-dot ${conv.user.isOnline ? 'online' : 'offline'}`}></div>
                            </div>
                            <div className="chat-info">
                                <div className="chat-name-time">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="chat-name">{conv.user.name}</span>
                                        {conv.unreadCount > 0 && (
                                            <span className="unread-badge">{conv.unreadCount}</span>
                                        )}
                                    </div>
                                    <span className="chat-time">
                                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="chat-last-message">
                                    {conv.lastMessage && (
                                        <>
                                            {(conv.lastMessage.sender._id === currentUser?._id || conv.lastMessage.sender === currentUser?._id) && 'You: '}
                                            {conv.lastMessage.image ? 'ส่งรูปภาพ' : (conv.lastMessage.text || '')}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Chat;
