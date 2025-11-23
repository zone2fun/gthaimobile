import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllUsers } from '../data/users';

const ChatDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const users = getAllUsers();
    const user = users.find(u => u.id === parseInt(id));
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [messages, setMessages] = useState([
        { id: 1, text: 'สวัสดีครับ', sender: 'them', time: '10:00', type: 'text' },
        { id: 2, text: 'สวัสดีครับ ทักทายนะครับ', sender: 'me', time: '10:05', type: 'text' },
        { id: 3, text: 'ยินดีที่ได้รู้จักครับ', sender: 'them', time: '10:06', type: 'text' },
    ]);
    const [inputText, setInputText] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user) {
        return <div className="app-content" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>User not found</div>;
    }

    const handleSend = () => {
        if (inputText.trim() === '') return;

        const newMessage = {
            id: messages.length + 1,
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };

        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            const newMessage = {
                id: messages.length + 1,
                text: '',
                image: imageUrl,
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'image'
            };
            setMessages([...messages, newMessage]);
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
                        <div className={`status-dot ${user.online ? 'online' : ''}`}></div>
                    </div>
                    <span className="chat-username">{user.name}</span>
                </div>
                <button className="more-btn">
                    <span className="material-icons">more_vert</span>
                </button>
            </header>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                        <div className="message-content">
                            {msg.type === 'image' ? (
                                <img src={msg.image} alt="Sent image" className="message-image" />
                            ) : (
                                msg.text
                            )}
                        </div>
                        <span className="message-time">{msg.time}</span>
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
