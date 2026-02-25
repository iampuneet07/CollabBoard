import { Crown, ShieldCheck, ShieldOff, Pencil, Lock, UserMinus } from 'lucide-react';

const UsersPanel = ({ users, currentUser, room, allowedDrawers = [], onGrantAccess, onRevokeAccess, onKickUser, isCurrentUserHost }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
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

    const isHost = (userId) => {
        return room?.host?._id === userId || room?.host === userId;
    };

    const hasDrawAccess = (userId) => {
        if (isHost(userId)) return true;
        return allowedDrawers.includes(userId);
    };

    const handleKick = (userId, username) => {
        if (window.confirm(`Are you sure you want to remove ${username} from the room?`)) {
            onKickUser(userId);
        }
    };

    return (
        <div className="users-panel">
            <div className="users-panel-title">
                Online — {users.length}
            </div>

            {/* Access Control Info */}
            <div className="access-control-info">
                <Lock size={12} />
                <span>Only host can draw by default. Host can grant access to participants.</span>
            </div>

            {users.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.875rem'
                }}>
                    No one is online yet
                </div>
            ) : (
                users.map((u) => (
                    <div key={u.socketId || u.id} className="user-item">
                        <div
                            className="user-avatar"
                            style={{ background: getAvatarColor(u.username) }}
                        >
                            {getInitials(u.username)}
                            <span className="online-dot"></span>
                        </div>
                        <div className="user-info">
                            <div className="user-name">
                                {u.username}
                                {u.id === currentUser?.id && (
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        color: 'var(--text-tertiary)',
                                        marginLeft: '6px'
                                    }}>
                                        (you)
                                    </span>
                                )}
                            </div>
                            <div className="user-role-row">
                                <div className={`user-role ${isHost(u.id) ? 'host' : 'participant'}`}>
                                    {isHost(u.id) && <Crown size={10} style={{ marginRight: '3px' }} />}
                                    {isHost(u.id) ? 'Host' : 'Participant'}
                                </div>
                                {/* Drawing access badge */}
                                <div className={`access-badge ${hasDrawAccess(u.id) ? 'has-access' : 'no-access'}`}>
                                    {hasDrawAccess(u.id) ? (
                                        <>
                                            <Pencil size={9} />
                                            Can Draw
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={9} />
                                            View Only
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Grant/Revoke buttons for host (not for self) */}
                        {isCurrentUserHost && !isHost(u.id) && (
                            <div className="access-actions" style={{ gap: '6px' }}>
                                {hasDrawAccess(u.id) ? (
                                    <button
                                        className="access-btn revoke"
                                        onClick={() => onRevokeAccess(u.id)}
                                        title="Revoke drawing access"
                                    >
                                        <ShieldOff size={14} />
                                    </button>
                                ) : (
                                    <button
                                        className="access-btn grant"
                                        onClick={() => onGrantAccess(u.id)}
                                        title="Grant drawing access"
                                    >
                                        <ShieldCheck size={14} />
                                    </button>
                                )}
                                <button
                                    className="access-btn revoke"
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}
                                    onClick={() => handleKick(u.id, u.username)}
                                    title="Remove participant"
                                >
                                    <UserMinus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default UsersPanel;
