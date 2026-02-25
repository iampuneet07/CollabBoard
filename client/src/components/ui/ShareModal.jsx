import { useState } from 'react';
import { Copy, Check, Share2, Link2, Hash, X, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareModal = ({ isOpen, onClose, roomId, roomName }) => {
    const [copiedField, setCopiedField] = useState(null);

    if (!isOpen) return null;

    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/whiteboard/${roomId}`;

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(field);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join "${roomName}" on CollabBoard`,
                    text: `Hey! Join my whiteboard room "${roomName}" on CollabBoard.\n\nRoom ID: ${roomId}`,
                    url: shareLink,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    toast.error('Share failed');
                }
            }
        } else {
            copyToClipboard(shareLink, 'link');
        }
    };

    const shareViaWhatsApp = () => {
        const msg = encodeURIComponent(
            `🎨 Join my whiteboard room "${roomName}" on CollabBoard!\n\n🔗 Link: ${shareLink}\n🆔 Room ID: ${roomId}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`Join "${roomName}" on CollabBoard`);
        const body = encodeURIComponent(
            `Hey!\n\nI'd like you to join my whiteboard room "${roomName}" on CollabBoard.\n\nClick the link below to join:\n${shareLink}\n\nOr use Room ID: ${roomId}\n\nSee you there! 🎨`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const shareViaTelegram = () => {
        const msg = encodeURIComponent(
            `🎨 Join my whiteboard room "${roomName}" on CollabBoard!\n🔗 ${shareLink}\n🆔 Room ID: ${roomId}`
        );
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${msg}`, '_blank');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="share-modal-header">
                    <div className="share-modal-title-row">
                        <div className="share-modal-icon">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h3>Share Room</h3>
                            <p className="share-modal-subtitle">Invite others to collaborate on "{roomName}"</p>
                        </div>
                    </div>
                    <button className="share-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Room ID */}
                <div className="share-field">
                    <label>
                        <Hash size={14} />
                        Room ID
                    </label>
                    <div className="share-field-row">
                        <div className="share-field-value room-id-value">{roomId}</div>
                        <button
                            className={`share-copy-btn ${copiedField === 'roomId' ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(roomId, 'roomId')}
                        >
                            {copiedField === 'roomId' ? <Check size={16} /> : <Copy size={16} />}
                            {copiedField === 'roomId' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Shareable Link */}
                <div className="share-field">
                    <label>
                        <Link2 size={14} />
                        Invite Link
                    </label>
                    <div className="share-field-row">
                        <div className="share-field-value link-value">{shareLink}</div>
                        <button
                            className={`share-copy-btn ${copiedField === 'link' ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(shareLink, 'link')}
                        >
                            {copiedField === 'link' ? <Check size={16} /> : <Copy size={16} />}
                            {copiedField === 'link' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Share via apps */}
                <div className="share-apps">
                    <label>Share via</label>
                    <div className="share-apps-row">
                        <button className="share-app-btn whatsapp" onClick={shareViaWhatsApp} title="WhatsApp">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>WhatsApp</span>
                        </button>
                        <button className="share-app-btn email" onClick={shareViaEmail} title="Email">
                            <Mail size={20} />
                            <span>Email</span>
                        </button>
                        <button className="share-app-btn telegram" onClick={shareViaTelegram} title="Telegram">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                            <span>Telegram</span>
                        </button>
                        <button className="share-app-btn native" onClick={handleNativeShare} title="More options">
                            <Share2 size={20} />
                            <span>More</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
