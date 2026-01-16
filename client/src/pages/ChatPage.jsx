import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import LoadingOverlay from '../components/LoadingOverlay';
import ImageModal from '../components/ImageModal';
import MediaGallery from '../components/MediaGallery';
import { LogOut, Send, Image as ImageIcon, Video as VideoIcon, Sun, Moon, Bell, BellOff, Search, X, Grid } from 'lucide-react';

function ChatPage({ token, username, onLogout, isDarkMode, toggleTheme }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showMediaGallery, setShowMediaGallery] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textInputRef = useRef(null);
    const searchInputRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const requestNotificationPermission = async () => {
        if (typeof Notification === 'undefined') {
            alert('Notifications are not supported on this device/browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        } catch (e) {
            console.error('Failed to request notification permission:', e);
        }
    };

    useEffect(() => {
        // Check initial permission status safely
        if (typeof Notification !== 'undefined') {
            setNotificationPermission(Notification.permission);
        }

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

        fetchMessages();

        // Connect to Socket.io
        const socketUrl = API_URL.replace('/api', '');
        socketRef.current = io(socketUrl);
        const socket = socketRef.current;

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
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    // Only notify if document is hidden (user is tabbed away) OR just notify always
                    // Usually notifying when hidden is better UX, but user asked for notifications.
                    // Let's notify regardless of focus state if it's not me.
                    try {
                        new Notification(`New message from ${senderName}`, {
                            body: newMsg.type === 'text' ? newMsg.content : `Sent a ${newMsg.type}`,
                            icon: '/vite.svg', // Use app icon
                        });
                    } catch (err) {
                        console.error('Notification error:', err);
                    }
                }
            }
        });

        socket.on('typing', (user) => {
            if (user !== username) {
                setTypingUsers((prev) => {
                    if (!prev.includes(user)) return [...prev, user];
                    return prev;
                });
            }
        });

        socket.on('stop_typing', (user) => {
            setTypingUsers((prev) => prev.filter((u) => u !== user));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, username]);

    useEffect(() => {
        if (!searchQuery) {
            scrollToBottom();
        }
    }, [messages, searchQuery]);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
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
                textInputRef.current?.focus();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (socketRef.current) {
            socketRef.current.emit('typing', username);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) socketRef.current.emit('stop_typing', username);
            }, 5000);
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
            {showMediaGallery && (
                <MediaGallery 
                    messages={messages} 
                    onClose={() => setShowMediaGallery(false)}
                    onImageClick={(src) => {
                        setPreviewImage(src);
                        // Keep gallery open in background
                    }}
                />
            )}

            <header className="app-header">
                <div className="header-left">
                    <h1>💬 Chat Room</h1>
                </div>
                <div className="header-right">
                    <span className="user-greeting">Hi, {username}</span>
                    {typeof Notification !== 'undefined' && (
                        <button 
                            onClick={requestNotificationPermission} 
                            className="icon-btn" 
                            title={notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
                        >
                            {notificationPermission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
                        </button>
                    )}
                    <button onClick={toggleTheme} className="icon-btn" title="切換主題">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    
                    {isSearchOpen ? (
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 mr-2 transition-all">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm px-2 w-32 md:w-48 text-gray-800 dark:text-gray-200"
                            />
                            <button 
                                onClick={() => {
                                    setSearchQuery('');
                                    setIsSearchOpen(false);
                                }} 
                                className="p-1 hover:text-red-500 text-gray-500"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsSearchOpen(true)} className="icon-btn" title="Search Messages">
                            <Search size={20} />
                        </button>
                    )}

                    <button onClick={() => setShowMediaGallery(true)} className="icon-btn" title="Media Gallery">
                        <Grid size={20} />
                    </button>

                    <button onClick={onLogout} className="icon-btn" title="登出">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="chat-container">
                <div className="messages-list">
                    {messages
                        .filter((msg) => {
                            const hasContent = (msg.content && msg.content.trim()) || msg.fileUrl;
                            if (!searchQuery) return hasContent;
                            return hasContent && msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
                        })
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

                {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                        {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="chat-input-area">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />

                    <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload Image/Video">
                        <ImageIcon size={24} />
                    </button>

                    <input type="text" ref={textInputRef} value={newMessage} onChange={handleInputChange} placeholder="Type a message..." />

                    <button type="submit" className="send-btn" disabled={!newMessage.trim() || isSending} onMouseDown={(e) => e.preventDefault()}>
                        <Send size={20} />
                    </button>
                </form>
            </main>
        </div>
    );
}

export default ChatPage;
