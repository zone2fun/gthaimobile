import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getMessages, sendMessage, deleteMessage, markAsRead } from '../services/api';
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

    return (
        <div className="chat-page">
            <header className="chat-header">
                <button className="back-btn-chat" onClick={() => navigate(-1)}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <div className="chat-user-info">
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
                            {msg.image ? (
                                <img src={msg.image} alt="Sent image" className="message-image" />
                            ) : (
                                msg.text
                            )}
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
                    <button className="icon-btn">
                        <span className="material-icons">camera_alt</span>
                    </button>
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
