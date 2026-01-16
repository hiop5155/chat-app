import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import LoadingOverlay from '../components/LoadingOverlay';
import ImageModal from '../components/ImageModal';
import { LogOut, Send, Image as ImageIcon, Video as VideoIcon, Sun, Moon } from 'lucide-react';

function ChatPage({ token, username, onLogout, isDarkMode, toggleTheme }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_URL}/chat`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Request Notification Permission on mount
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        // Connect to Socket.io
        const socketUrl = API_URL.replace('/api', '');
        const socket = io(socketUrl);

        socket.on('message', (newMsg) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((msg) => msg._id === newMsg._id)) return prev;
                return [...prev, newMsg];
            });

            // Browser Notification
            const senderName = newMsg.sender?.username || 'Unknown';
            // Only notify if it's not me
            if (senderName !== username) {
                // Check if permission is granted
                if (Notification.permission === 'granted') {
                    // Only notify if document is hidden (user is tabbed away) OR just notify always
                    // Usually notifying when hidden is better UX, but user asked for notifications.
                    // Let's notify regardless of focus state if it's not me.
                    new Notification(`New message from ${senderName}`, {
                        body: newMsg.type === 'text' ? newMsg.content : `Sent a ${newMsg.type}`,
                        icon: '/vite.svg', // Use app icon
                    });
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [token, username]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newMessage, type: 'text' }),
            });

            if (res.ok) {
                setNewMessage('');
                // fetchMessages(); // Handled by Socket.io
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            // 1. Upload file
            const uploadRes = await fetch(`${API_URL}/chat/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error);

            // 2. Send message with file URL
            const msgRes = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: '',
                    type: uploadData.type,
                    fileUrl: uploadData.fileUrl,
                }),
            });

            if (msgRes.ok) {
                // fetchMessages(); // Handled by Socket.io
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="app-container">
            <LoadingOverlay isVisible={uploading} />
            <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />

            <header className="app-header">
                <div className="header-left">
                    <h1>💬 Chat Room</h1>
                </div>
                <div className="header-right">
                    <span className="user-greeting">Hi, {username}</span>
                    <button onClick={toggleTheme} className="icon-btn" title="切換主題">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={onLogout} className="icon-btn" title="登出">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="chat-container">
                <div className="messages-list">
                    {messages
                        .filter((msg) => (msg.content && msg.content.trim()) || msg.fileUrl)
                        .map((msg) => {
                            const senderName = msg.sender?.username || 'Unknown User';
                            const isMe = senderName === username;
                            return (
                                <div key={msg._id} className={`message-row ${isMe ? 'my-message' : 'other-message'}`}>
                                    <div className="message-bubble">
                                        {!isMe && <div className="message-sender">{senderName}</div>}

                                        {msg.type === 'text' && <p>{msg.content}</p>}
                                        {msg.type === 'image' && (
                                            <img 
                                                src={`${API_URL.replace('/api', '')}${msg.fileUrl}`} 
                                                alt="Sent image" 
                                                className="message-media cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setPreviewImage(`${API_URL.replace('/api', '')}${msg.fileUrl}`)}
                                            />
                                        )}
                                        {msg.type === 'video' && (
                                            <video src={`${API_URL.replace('/api', '')}${msg.fileUrl}`} controls className="message-media" />
                                        )}
                                        <div className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />

                    <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload Image/Video">
                        <ImageIcon size={24} />
                    </button>

                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />

                    <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            </main>
        </div>
    );
}

export default ChatPage;
