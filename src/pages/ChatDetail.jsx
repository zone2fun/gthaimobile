import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getMessages, sendMessage, deleteMessage, markAsRead, updateAlbumAccessRequest, blockUser, unblockUser, createReport, getMe } from '../services/api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import { useTranslation } from 'react-i18next';

const ChatDetail = () => {
    const { t } = useTranslation();
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

    // Menu & Action States
    const [showMenu, setShowMenu] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportAdditionalInfo, setReportAdditionalInfo] = useState('');
    const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (token && id) {
                try {
                    const [userData, currentUserData, msgs] = await Promise.all([
                        getUser(id, token),
                        getMe(token),
                        getMessages(id, token)
                    ]);

                    setUser(userData);
                    setMessages(msgs);

                    // Check if this user is blocked
                    if (currentUserData && currentUserData.blockedUsers && currentUserData.blockedUsers.includes(id)) {
                        setIsBlocked(true);
                    }

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

    const handleBlock = async () => {
        try {
            await blockUser(id, token);
            setIsBlocked(true);
            setShowMenu(false);
        } catch (error) {
            console.error("Error blocking user:", error);
        }
    };

    const handleUnblock = async () => {
        try {
            await unblockUser(id, token);
            setIsBlocked(false);
            setShowMenu(false);
        } catch (error) {
            console.error("Error unblocking user:", error);
        }
    };

    const handleReport = () => {
        setReportReason('');
        setReportAdditionalInfo('');
        setShowReportModal(true);
        setShowMenu(false);
    };

    const confirmReport = async () => {
        if (!reportReason) return;

        try {
            await createReport(null, id, reportReason, reportAdditionalInfo, 'user', token);
            setShowReportModal(false);
            setReportReason('');
            setReportAdditionalInfo('');
            setShowReportSuccessModal(true);
        } catch (error) {
            console.error('Error reporting user:', error);
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
        // Initialize state from the populated relatedId object
        const [isApproved, setIsApproved] = useState(msg.relatedId?.status === 'approved');
        const [loading, setLoading] = useState(false);

        const handleToggle = async () => {
            if (!msg.relatedId) return;

            setLoading(true);
            const newStatus = isApproved ? 'rejected' : 'approved';
            // Use _id if populated, otherwise use relatedId directly if it's a string
            const requestId = msg.relatedId._id || msg.relatedId;

            try {
                await updateAlbumAccessRequest(requestId, newStatus, token);
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
                    <span>{t('chat.requestAlbumAccess')}</span>
                </div>

                {!isMe ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '14px', color: '#ccc' }}>{t('chat.allowAccess')}</span>
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
                        {t('chat.waitingForApproval')}
                    </div>
                )}
            </div>
        );
    };

    const renderMessageContent = (msg) => {
        const msgType = msg.type;
        const text = String(msg.text || '');

        if (msgType === 'request_album_access' || text === 'ACCESS_REQUEST') {
            return <AccessRequestMessage msg={msg} />;
        }

        // Check type OR text content for album access response
        else if (msgType === 'album_access_response' ||
            text.includes('ACCESS_APPROVED') ||
            text.includes('ACCESS_REJECTED')) {

            let displayText = text;
            let isApproved = false;

            if (text === 'ACCESS_APPROVED' || text.includes('ACCESS_APPROVED') || text.includes('อนุมัติ') || text.includes('Approved')) {
                displayText = t('chat.accessApproved');
                isApproved = true;
            } else if (text === 'ACCESS_REJECTED' || text.includes('ACCESS_REJECTED') || text.includes('ปฏิเสธ') || text.includes('Rejected')) {
                displayText = t('chat.accessRejected');
                isApproved = false;
            }

            return (
                <div style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: isApproved ? '#4CAF50' : '#ff4444' }}>
                        {displayText}
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
                <div style={{ position: 'relative' }}>
                    <button className="more-btn" onClick={() => setShowMenu(!showMenu)}>
                        <span className="material-icons">more_vert</span>
                    </button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            backgroundColor: '#1a1a1a',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            padding: '8px 0',
                            zIndex: 100,
                            minWidth: '150px',
                            border: '1px solid #333'
                        }}>
                            <button
                                onClick={handleReport}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 15px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff4444',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>flag</span>
                                Report User
                            </button>
                            <button
                                onClick={isBlocked ? handleUnblock : handleBlock}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 15px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>{isBlocked ? 'check_circle' : 'block'}</span>
                                {isBlocked ? 'Unblock User' : 'Block User'}
                            </button>
                        </div>
                    )}
                </div>
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


            {/* Report User Modal */}
            {
                showReportModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowReportModal(false)}>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '15px', padding: '30px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px' }}>รายงานผู้ใช้</h3>
                                <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>กรุณาเลือกเหตุผลที่คุณต้องการรายงานผู้ใช้นี้</p>
                            <div style={{ marginBottom: '20px' }}>
                                {['spam', 'อนาจาร', 'กล่าวร้ายผู้อื่น', 'แอบอ้าง', 'หลอกลวง', 'โปรไฟล์ปลอม', 'การล่วงละเมิด'].map((reason) => (
                                    <div key={reason} onClick={() => setReportReason(reason)} style={{ padding: '15px', marginBottom: '10px', borderRadius: '10px', border: `2px solid ${reportReason === reason ? '#a607d6' : '#333'}`, backgroundColor: reportReason === reason ? 'rgba(166, 7, 214, 0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${reportReason === reason ? '#a607d6' : '#666'}`, backgroundColor: reportReason === reason ? '#a607d6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {reportReason === reason && (<span className="material-icons" style={{ fontSize: '14px', color: 'white' }}>check</span>)}
                                        </div>
                                        <span>{reason}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                                <textarea value={reportAdditionalInfo} onChange={(e) => setReportAdditionalInfo(e.target.value)} placeholder="อธิบายเพิ่มเติมเกี่ยวกับปัญหา..." style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: 'white', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowReportModal(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '500' }}>ยกเลิก</button>
                                <button onClick={confirmReport} disabled={!reportReason} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: reportReason ? '#ff4444' : '#555', color: 'white', cursor: reportReason ? 'pointer' : 'not-allowed', fontWeight: '500' }}>ส่งรายงาน</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Report Success Modal */}
            {
                showReportSuccessModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease-in' }} onClick={() => setShowReportSuccessModal(false)}>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '40px 30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'scaleIn 0.4s ease-out' }}>
                                <span className="material-icons" style={{ fontSize: '48px', color: '#4CAF50' }}>check_circle</span>
                            </div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600' }}>ส่งรายงานสำเร็จ</h3>
                            <p style={{ color: '#888', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>ขอบคุณที่แจ้งให้เราทราบ<br />ทีมงานจะตรวจสอบและดำเนินการโดยเร็วที่สุด</p>
                            <button onClick={() => setShowReportSuccessModal(false)} style={{ width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(166, 7, 214, 0.3)' }}>เข้าใจแล้ว</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ChatDetail;
