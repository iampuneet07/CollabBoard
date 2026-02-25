import { useState, useRef, useEffect } from 'react';
import { Send, VolumeX, Volume2 } from 'lucide-react';

const ChatPanel = ({ messages, onSendMessage, currentUser, chatMuted, isHost, onToggleChatMute }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getAvatarColor = (name) => {
        const colors = [
            'linear-gradient(135deg, #7c3aed, #a855f7)',
            'linear-gradient(135deg, #3b82f6, #60a5fa)',
            'linear-gradient(135deg, #ef4444, #f97316)',
            'linear-gradient(135deg, #10b981, #34d399)',
            'linear-gradient(135deg, #ec4899, #f472b6)',
            'linear-gradient(135deg, #f59e0b, #fbbf24)',
            'linear-gradient(135deg, #06b6d4, #22d3ee)',
            'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        ];
        const index = (name || '').charCodeAt(0) % colors.length;
        return colors[index];
    };

    const canSend = !chatMuted || isHost;

    return (
        <div className="chat-panel">
            {/* Chat Mute Control (Host Only) */}
            {isHost && (
                <div className="chat-mute-control">
                    <button
                        className={`chat-mute-btn ${chatMuted ? 'muted' : ''}`}
                        onClick={onToggleChatMute}
                        title={chatMuted ? 'Unmute chat — allow participants to send messages' : 'Mute chat — only you can send messages'}
                    >
                        {chatMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        {chatMuted ? 'Chat Muted — Only You Can Send' : 'Chat Open — Click to Mute'}
                    </button>
                </div>
            )}

            {/* Muted notice for participants */}
            {chatMuted && !isHost && (
                <div className="chat-muted-notice">
                    <VolumeX size={14} />
                    <span>Chat is muted by the host. Only the host can send messages.</span>
                </div>
            )}

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--text-tertiary)',
                        fontSize: '0.875rem'
                    }}>
                        No messages yet. Say hello! 👋
                    </div>
                )}

                {messages.map((msg, i) => {
                    if (msg.type === 'system') {
                        return (
                            <div key={msg._id || i} className="chat-message-system">
                                <span>{msg.content}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg._id || i} className="chat-message">
                            <div
                                className="chat-message-avatar"
                                style={{ background: getAvatarColor(msg.sender?.username || msg.senderName) }}
                            >
                                {getInitials(msg.sender?.username || msg.senderName)}
                            </div>
                            <div className="chat-message-body">
                                <div className="chat-message-header">
                                    <span className="chat-message-name">
                                        {msg.sender?.username || msg.senderName}
                                    </span>
                                    <span className="chat-message-time">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                                <div className="chat-message-content">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <form className="chat-input-wrapper" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={canSend ? 'Type a message...' : '🔇 Chat is muted by host'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        maxLength={1000}
                        disabled={!canSend}
                    />
                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={!input.trim() || !canSend}
                    >
                        <Send />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
