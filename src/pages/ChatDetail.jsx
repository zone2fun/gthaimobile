import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getMessages, sendMessage } from '../services/api';
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
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
                    if (socket) {
                        socket.emit('join chat', id);
                    }
                } catch (error) {
                    console.error("Error fetching chat data:", error);
                }
            }
        };
        fetchData();
    }, [id, token, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessage) => {
            if (newMessage.sender._id === id || newMessage.recipient._id === id) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on('message received', handleMessageReceived);

        return () => {
            socket.off('message received', handleMessageReceived);
        };
    }, [socket, id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user) {
        return <div className="app-content" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    const handleSend = async () => {
        if (inputText.trim() === '') return;

        try {
            const newMessage = await sendMessage({
                recipientId: id,
                text: inputText
            }, token);

            setMessages([...messages, newMessage]);
            setInputText('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);

            try {
                const newMessage = await sendMessage({
                    recipientId: id,
                    image: imageUrl
                }, token);
                setMessages([...messages, newMessage]);
            } catch (error) {
                console.error("Error sending image:", error);
            }
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
                        <div className={`status-dot ${user.isOnline ? 'online' : ''}`}></div>
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
                        <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
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
                        onChange={(e) => setInputText(e.target.value)}
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
