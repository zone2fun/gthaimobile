import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getConversations } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import VerifiedAvatar from '../components/VerifiedAvatar';

const Chat = () => {
    const { t } = useTranslation();
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
            <h2 className="section-title">{t('chat.conversations')}</h2>
            <div className="chat-list">
                {conversations.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#a0a0a0' }}>
                        <p>{t('chat.noMessages')}</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div key={conv.user._id} className="chat-list-item" onClick={() => navigate(`/chat/${conv.user._id}`)}>
                            <div className="chat-avatar">
                                <VerifiedAvatar
                                    src={conv.user.img}
                                    alt={conv.user.name}
                                    isVerified={conv.user.isVerified}
                                    size={50}
                                    style={{ width: '50px', height: '50px' }}
                                />
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
                                            {(conv.lastMessage.sender._id === currentUser?._id || conv.lastMessage.sender === currentUser?._id) && `${t('chat.you')}: `}
                                            {(() => {
                                                // Debug logging
                                                if (!conv.lastMessage.type) {
                                                    console.log('Last message missing type:', conv.lastMessage);
                                                }


                                                const msgType = conv.lastMessage.type;
                                                const text = conv.lastMessage.text || '';

                                                if (conv.lastMessage.image) return t('chat.sentImage');
                                                if (msgType === 'request_album_access' || text === 'ACCESS_REQUEST') return t('chat.accessRequestText');

                                                // Check type OR text content for album access response
                                                if (msgType === 'album_access_response' ||
                                                    text.includes('ACCESS_APPROVED') ||
                                                    text.includes('ACCESS_REJECTED')) {

                                                    if (text === 'ACCESS_APPROVED' || text.includes('ACCESS_APPROVED') || text.includes('อนุมัติ') || text.includes('Approved')) {
                                                        return t('chat.accessApproved');
                                                    }
                                                    if (text === 'ACCESS_REJECTED' || text.includes('ACCESS_REJECTED') || text.includes('ปฏิเสธ') || text.includes('Rejected')) {
                                                        return t('chat.accessRejected');
                                                    }
                                                }
                                                return conv.lastMessage.text || '';
                                            })()}
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
