import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getMessages, sendMessage, deleteMessage, markAsRead, updateAlbumAccessRequest } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';

const ChatDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (token && id) {
                try {
                    const userData = await getUser(id, token);
                    setUser(userData);
                    const msgs = await getMessages(id, token);
                    setMessages(msgs);

                    // Mark messages as read
                    await markAsRead(id, token);
                } catch (error) {
                    console.error("Error fetching chat data:", error);
                }
            }
        };
        fetchData();
    }, [id, token]);

    useEffect(() => {
        if (!socket || !currentUser || !user) return;

        const roomId = [currentUser._id, user._id].sort().join('_');
        socket.emit('join chat', roomId);

        const handleMessageReceived = (newMessage) => {
            if (newMessage.sender._id === id || newMessage.recipient._id === id) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.filter(msg => msg._id !== messageId));
        };

        const handleTyping = () => {
            setIsTyping(true);
        };

        const handleStopTyping = () => {
            setIsTyping(false);
        };

        socket.on('message received', handleMessageReceived);
        socket.on('message deleted', handleMessageDeleted);
        socket.on('typing', handleTyping);
        socket.on('stop typing', handleStopTyping);

        return () => {
            socket.off('message received', handleMessageReceived);
            socket.off('message deleted', handleMessageDeleted);
            socket.off('typing', handleTyping);
            socket.off('stop typing', handleStopTyping);
        };
    }, [socket, id, currentUser, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleTyping = () => {
        if (socket && currentUser && user) {
            const roomId = [currentUser._id, user._id].sort().join('_');
            socket.emit('typing', roomId);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop typing', roomId);
            }, 3000);
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        handleTyping();
    };

    if (!user) {
        return <div className="app-content" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    const handleSend = async () => {
        if (inputText.trim() === '') return;

        try {
            const formData = new FormData();
            formData.append('recipientId', id);
            formData.append('text', inputText);

            const newMessage = await sendMessage(formData, token);

            setMessages([...messages, newMessage]);
            setInputText('');

            // Stop typing when message is sent
            if (socket && currentUser && user) {
                const roomId = [currentUser._id, user._id].sort().join('_');
                socket.emit('stop typing', roomId);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('recipientId', id);
                formData.append('image', file);

                const newMessage = await sendMessage(formData, token);
                setMessages([...messages, newMessage]);
            } catch (error) {
                console.error("Error sending image:", error);
            }
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId, token);
            setMessages(messages.filter(msg => msg._id !== messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleAccessResponse = async (requestId, status) => {
        try {
            await updateAlbumAccessRequest(requestId, status, token);
            // Update message status locally or re-fetch messages
            // For simplicity, we can just reload messages or update the specific message if we had state for it
            // But since the backend creates a new response message, we should just see it appear
        } catch (error) {
            console.error('Error updating access request:', error);
        }
    };

    const AccessRequestMessage = ({ msg }) => {
        const isMe = msg.sender._id === currentUser?._id || msg.sender === currentUser?._id;
        // We need to know the current status. For now, we'll assume 'pending' initially 
        // or try to infer from recent messages? 
        // Better: fetch status on mount if it's a request message
        // But for simplicity in this turn, let's use a local state that defaults to false (not approved)
        // unless we know otherwise.
        // Actually, the toggle should reflect the TRUE state.
        // Let's assume the user starts with 'pending' (false).
        const [isApproved, setIsApproved] = useState(false);
        const [loading, setLoading] = useState(false);

        const handleToggle = async () => {
            setLoading(true);
            const newStatus = isApproved ? 'rejected' : 'approved';
            try {
                await updateAlbumAccessRequest(msg.relatedId, newStatus, token);
                setIsApproved(!isApproved);
            } catch (error) {
                console.error('Error updating access request:', error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div style={{ padding: '10px', textAlign: 'center', minWidth: '200px' }}>
                <div style={{ marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="material-icons" style={{ color: '#a607d6' }}>lock</span>
                    <span>ขอสิทธิ์เข้าถึงอัลบั้ม</span>
                </div>

                {!isMe ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '14px', color: '#ccc' }}>อนุญาตให้เข้าถึง</span>
                        <div
                            onClick={!loading ? handleToggle : undefined}
                            style={{
                                width: '50px',
                                height: '28px',
                                backgroundColor: isApproved ? '#a607d6' : '#444',
                                borderRadius: '14px',
                                position: 'relative',
                                cursor: loading ? 'wait' : 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: isApproved ? '24px' : '2px',
                                transition: 'left 0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                        รอการอนุมัติจากเจ้าของ...
                    </div>
                )}
            </div>
        );
    };

    const renderMessageContent = (msg) => {
        if (msg.type === 'request_album_access') {
            return <AccessRequestMessage msg={msg} />;
        } else if (msg.type === 'album_access_response') {
            return (
                <div style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: msg.text.includes('อนุมัติ') ? '#4CAF50' : '#ff4444' }}>
                        {msg.text}
                    </div>
                </div>
            );
        } else if (msg.image) {
            return <img src={msg.image} alt="Sent image" className="message-image" />;
        } else {
            return msg.text;
        }
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <button className="back-btn-chat" onClick={() => navigate(-1)}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <div className="chat-user-info" onClick={() => navigate(`/user/${id}`)} style={{ cursor: 'pointer' }}>
                    <div className="chat-avatar">
                        <img src={user.img} alt={user.name} />
                        <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    <span className="chat-username">{user.name}</span>
                </div>
                <button className="more-btn">
                    <span className="material-icons">more_vert</span>
                </button>
            </header>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg._id || msg.id} className={`message-bubble ${(msg.sender._id === currentUser?._id || msg.sender === currentUser?._id) ? 'me' : 'them'}`}>
                        <div className="message-content">
                            {renderMessageContent(msg)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(msg.sender._id === currentUser?._id || msg.sender === currentUser?._id) && (
                                <button
                                    onClick={() => handleDeleteMessage(msg._id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px', color: '#fff' }}>delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator Bubble */}
                {isTyping && (
                    <div className="message-bubble them">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-bar">
                <div className="chat-actions">
                    {/* <button className="icon-btn">
                        <span className="material-icons">camera_alt</span>
                    </button> */}
                    <button className="icon-btn" onClick={() => fileInputRef.current.click()}>
                        <span className="material-icons">image</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="พิมพ์ข้อความ..."
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                    />
                </div>
                <button className="send-btn" onClick={handleSend}>
                    <span className="material-icons">send</span>
                </button>
            </div>
        </div>
    );
};

export default ChatDetail;
