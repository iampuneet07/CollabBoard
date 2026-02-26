import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShareModal from '../components/ui/ShareModal';
import {
    Palette, Plus, LogIn, LogOut, Users, Clock, Moon, Sun,
    LayoutGrid, Copy, Share2, Pencil, Smartphone, FileText,
    Trash2, AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [shareRoom, setShareRoom] = useState(null);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data.rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) {
            toast.error('Please enter a room name');
            return;
        }

        setCreating(true);
        try {
            const res = await api.post('/rooms', { name: newRoomName.trim() });
            toast.success('Room created! 🎨');
            setNewRoomName('');
            navigate(`/whiteboard/${res.data.room.roomId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create room');
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinRoomId.trim()) {
            toast.error('Please enter a Room ID');
            return;
        }

        setJoining(true);
        try {
            await api.post('/rooms/join', { roomId: joinRoomId.trim() });
            toast.success('Joined room! 🚀');
            setJoinRoomId('');
            navigate(`/whiteboard/${joinRoomId.trim().toUpperCase()}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setJoining(false);
        }
    };

    const handleRoomClick = (roomId) => {
        navigate(`/whiteboard/${roomId}`);
    };

    const copyRoomId = (e, roomId) => {
        e.stopPropagation();
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied!');
    };

    const handleShareRoom = (e, room) => {
        e.stopPropagation();
        setShareRoom(room);
    };

    const handleDeleteRoom = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await api.delete(`/rooms/${deleteConfirm.roomId}`);
            toast.success('Room deleted successfully');
            setRooms(rooms.filter(r => r.roomId !== deleteConfirm.roomId));
            setDeleteConfirm(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete room');
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isHost = (room) => {
        const userId = user?.id || user?._id;
        const hostId = room.host?._id || room.host;
        return hostId?.toString() === userId?.toString();
    };

    return (
        <div className="dashboard-page">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <div className="nav-brand-icon">
                        <Palette />
                    </div>
                    <h2>CollabBoard</h2>
                </div>

                <div className="nav-actions">
                    <button
                        className="btn-icon tooltip"
                        data-tooltip={isDark ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="nav-user">
                        <div className="nav-avatar">
                            {getInitials(user?.username)}
                        </div>
                        <span className="nav-username">{user?.username}</span>
                    </div>

                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-hero">
                    <h1>Your Creative Space</h1>
                    <p>Create or join rooms to collaborate in real-time with your team</p>
                </div>

                <div className="dashboard-actions">
                    <div className="action-card">
                        <div className="action-card-icon">
                            <Plus />
                        </div>
                        <h3>Create Room</h3>
                        <p>Start a new collaborative whiteboard session for your team.</p>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter room name..."
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                maxLength={100}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-full btn-sm"
                                disabled={creating}
                            >
                                <Plus size={16} />
                                {creating ? 'Creating...' : 'Create Room'}
                            </button>
                        </form>
                    </div>

                    <div className="action-card">
                        <div className="action-card-icon">
                            <LogIn />
                        </div>
                        <h3>Join Room</h3>
                        <p>Enter a Room ID shared by your teammate to join their session.</p>
                        <form onSubmit={handleJoinRoom}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Room ID (e.g. A1B2C3D4)"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                maxLength={8}
                                style={{ letterSpacing: '0.1em', fontFamily: 'monospace' }}
                            />
                            <button
                                type="submit"
                                className="btn btn-secondary btn-full btn-sm"
                                disabled={joining}
                            >
                                <LogIn size={16} />
                                {joining ? 'Joining...' : 'Join Room'}
                            </button>
                        </form>
                    </div>

                    <div className="action-card action-card-sketch">
                        <div className="action-card-icon sketch-icon">
                            <Pencil />
                        </div>
                        <h3>My Whiteboard</h3>
                        <p>Practice on your own personal whiteboard. Draw, save & share!</p>
                        <button
                            className="btn btn-accent btn-full btn-sm"
                            onClick={() => navigate('/sketch')}
                        >
                            <Pencil size={16} />
                            Open Whiteboard
                        </button>
                    </div>
                </div>

                <div className="rooms-section">
                    <h2>
                        <LayoutGrid size={20} />
                        Your Rooms
                    </h2>

                    {loadingRooms ? (
                        <div className="empty-rooms">
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            <p>Loading rooms...</p>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="empty-rooms">
                            <Palette size={48} />
                            <p>No rooms yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="rooms-grid">
                            {rooms.map((room) => (
                                <div
                                    key={room._id}
                                    className="room-card"
                                    onClick={() => handleRoomClick(room.roomId)}
                                >
                                    <div className="room-card-header">
                                        <span className="room-card-name">{room.name}</span>
                                        <div className="room-card-actions">
                                            {isHost(room) && (
                                                <button
                                                    className="room-delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(room);
                                                    }}
                                                    title="Delete Room"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="room-share-btn"
                                                onClick={(e) => handleShareRoom(e, room)}
                                                title="Share Room"
                                            >
                                                <Share2 />
                                            </button>
                                            <span
                                                className="room-card-id"
                                                onClick={(e) => copyRoomId(e, room.roomId)}
                                                title="Click to copy"
                                            >
                                                <Copy size={10} style={{ marginRight: '4px', display: 'inline' }} />
                                                {room.roomId}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="room-card-meta">
                                        <span>
                                            <Users size={14} />
                                            {room.participants?.length || 0} members
                                        </span>
                                        <span>
                                            <Clock size={14} />
                                            {formatDate(room.updatedAt)}
                                        </span>
                                        <span className="room-status">
                                            <span className={`room-status-dot ${room.isActive ? '' : 'inactive'}`}></span>
                                            {room.isActive ? 'Active' : 'Closed'}
                                        </span>
                                        {isHost(room) && (
                                            <span className="room-host-badge">Host</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Additional Resources */}
                <div className="resources-section">
                    <h2>
                        <FileText size={20} />
                        Additional Resources
                    </h2>
                    <div className="resources-grid">
                        <div
                            className="resource-card"
                            onClick={() => navigate('/mobile-demo')}
                        >
                            <div className="resource-card-icon mobile-icon">
                                <Smartphone size={22} />
                            </div>
                            <div className="resource-card-content">
                                <h4>Mobile Responsive Demo</h4>
                                <p>View mobile-specific UI patterns including bottom navigation, collapsible sidebars, and touch optimizations.</p>
                                <span className="resource-path">Route: /mobile-demo</span>
                            </div>
                        </div>
                        <div
                            className="resource-card"
                            onClick={() => window.open('/WIREFRAME_DOCUMENTATION.md', '_blank')}
                        >
                            <div className="resource-card-icon docs-icon">
                                <FileText size={22} />
                            </div>
                            <div className="resource-card-content">
                                <h4>Design System Documentation</h4>
                                <p>Complete design system specifications including colors, typography, spacing, and component patterns.</p>
                                <span className="resource-path">File: /WIREFRAME_DOCUMENTATION.md</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {shareRoom && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShareRoom(null)}
                    roomId={shareRoom.roomId}
                    roomName={shareRoom.name}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h3>Delete Room</h3>
                        <p>
                            Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
                            This will permanently remove all whiteboard data, messages, and participants.
                            This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={handleDeleteRoom}
                                disabled={deleting}
                            >
                                <Trash2 size={16} />
                                {deleting ? 'Deleting...' : 'Delete Room'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
