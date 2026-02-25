import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { connectSocket, disconnectSocket } from '../utils/socket';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ChatPanel from '../components/chat/ChatPanel';
import UsersPanel from '../components/room/UsersPanel';
import ShareModal from '../components/ui/ShareModal';
import {
    ArrowLeft, Pencil, Eraser, Trash2, Undo2, Redo2,
    Download, MessageSquare, Users, Sun, Moon,
    PanelRightClose, PanelRightOpen, Copy, Share2,
    Plus, ChevronLeft, ChevronRight, FilePlus, Layers,
    Type, Lock, Square, Circle, Minus, ArrowRight,
    Monitor, MonitorOff,
    Video, VideoOff, Mic, MicOff, PhoneOff, Phone, Crown
} from 'lucide-react';

const COLORS = [
    '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7',
    '#ec4899', '#f97316', '#14b8a6', '#06b6d4', '#8b5cf6', '#6366f1',
    '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#fbbf24', '#34d399'
];

const WhiteboardPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const containerRef = useRef(null);
    const socketRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState(isDark ? '#ffffff' : '#ef4444');
    const [brushSize, setBrushSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [sidebarTab, setSidebarTab] = useState('chat');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [shareOpen, setShareOpen] = useState(false);

    // Access control
    const [allowedDrawers, setAllowedDrawers] = useState([]);
    const [allowedScreenSharers, setAllowedScreenSharers] = useState([]);
    const [chatMuted, setChatMuted] = useState(false);

    // Text tool state
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState(null);
    const [textFontSize, setTextFontSize] = useState(20);
    const textInputRef = useRef(null);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const textDragOffset = useRef({ x: 0, y: 0 });

    // WebRTC / Call State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, username, audioEnabled, videoEnabled } }
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isInCall, setIsInCall] = useState(false);
    const [callPrompt, setCallPrompt] = useState(null); // { callerName, callerId, mediaType, socketId }
    const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    // Video Grid Draggable State
    const [videoGridPos, setVideoGridPos] = useState({ x: Math.max(20, window.innerWidth - 420), y: 70 });
    const [isDraggingVideoGrid, setIsDraggingVideoGrid] = useState(false);
    const videoGridDragOffset = useRef({ x: 0, y: 0 });

    // Shape tool state
    const [shapeFilled, setShapeFilled] = useState(false);
    const [shapeStartPos, setShapeStartPos] = useState(null);
    const preCanvasRef = useRef(null); // snapshot before shape drawing for preview

    // Undo/Redo
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const currentStrokeRef = useRef([]);

    // Multi-page state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pagesRef = useRef([]);

    // Initialize canvas
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        contextRef.current = ctx;

        // Only fill with background if canvas is truly new/empty
        // (This prevents erasing when toggling theme if we don't redraw)
        if (history.length === 0) {
            ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // Restore current state
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = canvas.toDataURL();
        }
    }, [isDark]);

    // Update context properties when state changes (Fixes color bug)
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : color;
            contextRef.current.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        }
    }, [color, brushSize, tool, isDark]);

    // Fetch room data
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`/rooms/${roomId}`);
                setRoom(res.data.room);
            } catch (error) {
                toast.error('Room not found');
                navigate('/dashboard');
                return;
            }
            setLoading(false);
        };
        fetchRoom();
    }, [roomId, navigate]);

    // Initialize canvas and socket
    useEffect(() => {
        if (loading) return;

        initCanvas();

        // Init page 1 
        setTimeout(() => {
            if (canvasRef.current && pagesRef.current.length === 0) {
                const imageData = canvasRef.current.toDataURL();
                pagesRef.current = [{
                    imageData,
                    history: [imageData],
                    historyIndex: 0
                }];
            }
        }, 200);

        const socket = connectSocket();
        socketRef.current = socket;

        socket.emit('join-room', roomId);

        // Socket event listeners
        socket.on('whiteboard-data', (strokes) => {
            if (strokes && strokes.length > 0) {
                redrawStrokes(strokes);
                setHistory([canvasRef.current.toDataURL()]);
                setHistoryIndex(0);
            } else {
                saveToHistory();
            }
        });

        socket.on('users-updated', (users) => {
            setOnlineUsers(users);
        });

        socket.on('access-updated', (data) => {
            setAllowedDrawers(data.allowedDrawers || []);
            setAllowedScreenSharers(data.allowedScreenSharers || []);
        });

        socket.on('chat-mute-updated', (data) => {
            setChatMuted(data.chatMuted);
        });

        socket.on('chat-blocked', (data) => {
            toast.error(data.message, { id: 'chat-blocked' });
        });

        socket.on('room-deleted', (data) => {
            toast.error(data.message, { duration: 5000 });
            navigate('/dashboard');
        });

        socket.on('user-kicked', (data) => {
            if (data.userId === user?.id) {
                toast.error(data.message, { duration: 5000 });
                navigate('/dashboard');
            } else {
                // Remove from online users if they are in the list
                setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
                toast(`${data.username || 'A user'} was removed by host`, { icon: '🚫' });
            }
        });

        // WebRTC Signaling Listeners
        socket.on('call-started', (data) => {
            if (isInCall) {
                // If we are already in call, we initiate P2P with the new caller
                initiatePeerConnection(data.callerSocketId, data.callerName, data.callerId, false);
            } else {
                // Show a prompt to join the call
                setCallPrompt(data);
                toast(`Call started by ${data.callerName}`, { icon: '📞', id: 'call-started-toast' });
            }
        });

        socket.on('call-ended', (data) => {
            setRemoteStreams(prev => {
                const newState = { ...prev };
                delete newState[data.socketId];
                return newState;
            });
            if (callPrompt?.socketId === data.socketId) {
                setCallPrompt(null);
            }
            closePeerConnection(data.socketId);
        });

        socket.on('webrtc-offer', async (data) => {
            await handleWebRTCOffer(data);
        });

        socket.on('webrtc-answer', async (data) => {
            const pc = peerConnections.current[data.answererSocketId];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        socket.on('webrtc-ice-candidate', async (data) => {
            const pc = peerConnections.current[data.senderSocketId];
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socket.on('media-toggled', (data) => {
            setRemoteStreams(prev => {
                if (!prev[data.socketId]) return prev;
                return {
                    ...prev,
                    [data.socketId]: {
                        ...prev[data.socketId],
                        audioEnabled: data.audioEnabled,
                        videoEnabled: data.videoEnabled
                    }
                };
            });
        });

        socket.on('call-ended', (data) => {
            closePeerConnection(data.socketId);
        });

        socket.on('add-text', (data) => {
            if (data.textData) {
                drawTextOnCanvas(data.textData);
                saveToHistory();
            }
        });

        socket.on('draw-shape', (data) => {
            if (data.shapeData) {
                drawShapeOnCanvas(data.shapeData);
                saveToHistory();
            }
        });

        socket.on('message-history', (msgs) => {
            setMessages(msgs);
        });

        socket.on('new-message', (msg) => {
            setMessages(prev => [...prev, msg]);
            if (sidebarTab !== 'chat' || !sidebarOpen) {
                setUnreadMessages(prev => prev + 1);
            }
        });

        socket.on('draw-start', (data) => {
            handleRemoteDrawStart(data);
        });

        socket.on('draw-move', (data) => {
            handleRemoteDrawMove(data);
        });

        socket.on('draw-end', () => {
            saveToHistory();
        });

        socket.on('board-cleared', () => {
            clearCanvas();
            saveToHistory();
        });

        socket.on('cursor-move', (data) => {
            setRemoteCursors(prev => ({
                ...prev,
                [data.userId]: { x: data.x, y: data.y, username: data.username }
            }));
        });

        socket.on('undo', () => {
            // Remote undo handled via full state sync
        });

        socket.on('redo', () => {
            // Remote redo handled via full state sync
        });

        // Handle resize
        const handleResize = () => {
            const imageData = canvasRef.current.toDataURL();
            initCanvas();
            const img = new Image();
            img.onload = () => {
                contextRef.current.drawImage(img, 0, 0);
            };
            img.src = imageData;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            socket.emit('leave-room', roomId);
            socket.off('whiteboard-data');
            socket.off('users-updated');
            socket.off('message-history');
            socket.off('new-message');
            socket.off('draw-start');
            socket.off('draw-move');
            socket.off('draw-end');
            socket.off('board-cleared');
            socket.off('cursor-move');
            socket.off('undo');
            socket.off('redo');
            socket.off('access-updated');
            socket.off('chat-mute-updated');
            socket.off('chat-blocked');
            socket.off('add-text');
            socket.off('draw-shape');
            window.removeEventListener('resize', handleResize);
            disconnectSocket();
        };
    }, [loading, roomId]);

    // Save canvas state to history
    const saveToHistory = () => {
        if (!canvasRef.current) return;
        const imageData = canvasRef.current.toDataURL();
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(imageData);
            const trimmed = newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
            const newIdx = Math.min(historyIndex + 1, 49);
            if (pagesRef.current[currentPage]) {
                pagesRef.current[currentPage] = {
                    imageData,
                    history: trimmed,
                    historyIndex: newIdx,
                };
            }
            return trimmed;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    // Redraw strokes from server
    const redrawStrokes = (strokes) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        strokes.forEach(stroke => {
            // Handle text strokes
            if (stroke.type === 'text') {
                ctx.save();
                ctx.font = `${stroke.fontSize || 20}px ${stroke.fontFamily || 'Inter, sans-serif'}`;
                ctx.fillStyle = stroke.color || (isDark ? '#ffffff' : '#000000');
                ctx.textBaseline = 'top';
                const lines = (stroke.text || '').split('\n');
                const lineHeight = (stroke.fontSize || 20) * 1.3;
                lines.forEach((line, idx) => {
                    ctx.fillText(line, stroke.x, stroke.y + idx * lineHeight);
                });
                ctx.restore();
                return;
            }

            // Handle shape strokes
            if (stroke.type === 'shape') {
                drawShapeOnCanvas(stroke);
                return;
            }

            if (!stroke.points || stroke.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : stroke.color;
            ctx.lineWidth = stroke.brushSize || 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    };

    // Draw text on canvas helper
    const drawTextOnCanvas = (textData) => {
        const ctx = contextRef.current;
        if (!ctx || !textData.text) return;
        ctx.save();
        ctx.font = `${textData.fontSize || 20}px ${textData.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillStyle = textData.color || (isDark ? '#ffffff' : '#000000');
        ctx.textBaseline = 'top';
        const lines = textData.text.split('\n');
        const lineHeight = (textData.fontSize || 20) * 1.3;
        lines.forEach((line, idx) => {
            ctx.fillText(line, textData.x, textData.y + idx * lineHeight);
        });
        ctx.restore();
    };

    // Draw shape on canvas helper
    const drawShapeOnCanvas = (shapeData) => {
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.save();
        ctx.strokeStyle = shapeData.color || (isDark ? '#ffffff' : '#000000');
        ctx.lineWidth = shapeData.brushSize || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const { shapeType, x, y, width, height, endX, endY, filled } = shapeData;

        if (shapeType === 'rectangle') {
            if (filled) {
                ctx.fillStyle = shapeData.color || '#ffffff';
                ctx.fillRect(x, y, width, height);
            } else {
                ctx.strokeRect(x, y, width, height);
            }
        } else if (shapeType === 'circle') {
            const rx = Math.abs(width) / 2;
            const ry = Math.abs(height) / 2;
            const cx = x + width / 2;
            const cy = y + height / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (filled) {
                ctx.fillStyle = shapeData.color || '#ffffff';
                ctx.fill();
            } else {
                ctx.stroke();
            }
        } else if (shapeType === 'line') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        } else if (shapeType === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(endY - y, endX - x);
            const headLen = 15;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        } else if (shapeType === 'diamond') {
            const cx = x + width / 2;
            const cy = y + height / 2;
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(x + width, cy);
            ctx.lineTo(cx, y + height);
            ctx.lineTo(x, cy);
            ctx.closePath();
            if (filled) {
                ctx.fillStyle = shapeData.color || '#ffffff';
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
        ctx.restore();
    };

    const SHAPE_TOOLS = ['rectangle', 'circle', 'line', 'arrow', 'diamond'];
    const isShapeTool = SHAPE_TOOLS.includes(tool);

    // Check if current user can draw
    const isCurrentUserHost = room?.host?._id === user?.id || room?.host === user?.id;
    const canDraw = isCurrentUserHost || allowedDrawers.includes(user?.id);

    // Remote draw handlers
    const handleRemoteDrawStart = (data) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = data.tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : data.color;
        ctx.lineWidth = data.brushSize || 3;
        ctx.moveTo(data.x, data.y);
    };

    const handleRemoteDrawMove = (data) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        ctx.strokeStyle = data.tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : data.color;
        ctx.lineWidth = data.brushSize || 3;
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    };

    // Drawing handlers
    const startDrawing = (e) => {
        if (!canDraw) {
            toast.error('You do not have drawing access. Ask the host to grant you access.', { id: 'no-access' });
            return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        // Text tool: place text input at click position
        if (tool === 'text') {
            setTextPosition({ x, y });
            setTextInput('');
            setTimeout(() => textInputRef.current?.focus(), 50);
            return;
        }

        // Shape tool: start tracking shape
        if (isShapeTool) {
            setShapeStartPos({ x, y });
            setIsDrawing(true);
            // Save canvas state for preview
            preCanvasRef.current = canvasRef.current.toDataURL();
            return;
        }

        const ctx = contextRef.current;
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : color;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        ctx.moveTo(x, y);

        setIsDrawing(true);
        currentStrokeRef.current = [{ x, y }];

        socketRef.current?.emit('draw-start', {
            roomId,
            x, y,
            color,
            brushSize: tool === 'eraser' ? brushSize * 3 : brushSize,
            tool
        });
    };

    const draw = (e) => {
        if (!isDrawing || !canDraw) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        // Shape preview while dragging
        if (isShapeTool && shapeStartPos) {
            const shapeData = {
                shapeType: tool,
                x: Math.min(shapeStartPos.x, x),
                y: Math.min(shapeStartPos.y, y),
                width: x - shapeStartPos.x,
                height: y - shapeStartPos.y,
                endX: x,
                endY: y,
                color,
                brushSize,
                filled: shapeFilled
            };
            // For rectangle / circle / diamond, use abs values
            if (['rectangle', 'circle', 'diamond'].includes(tool)) {
                shapeData.x = Math.min(shapeStartPos.x, x);
                shapeData.y = Math.min(shapeStartPos.y, y);
                shapeData.width = Math.abs(x - shapeStartPos.x);
                shapeData.height = Math.abs(y - shapeStartPos.y);
            }
            if (['line', 'arrow'].includes(tool)) {
                shapeData.x = shapeStartPos.x;
                shapeData.y = shapeStartPos.y;
            }
            // Restore saved canvas, then draw preview
            if (preCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = contextRef.current;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    drawShapeOnCanvas(shapeData);
                };
                img.src = preCanvasRef.current;
            }
            socketRef.current?.emit('cursor-move', { roomId, x, y });
            return;
        }

        const ctx = contextRef.current;
        ctx.lineTo(x, y);
        ctx.stroke();

        currentStrokeRef.current.push({ x, y });

        socketRef.current?.emit('draw-move', {
            roomId,
            x, y,
            color,
            brushSize: tool === 'eraser' ? brushSize * 3 : brushSize,
            tool
        });

        // Cursor tracking
        socketRef.current?.emit('cursor-move', { roomId, x, y });
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;

        // Shape tool: finalize shape
        if (isShapeTool && shapeStartPos) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = (e?.clientX || e?.changedTouches?.[0]?.clientX || 0) - rect.left;
            const y = (e?.clientY || e?.changedTouches?.[0]?.clientY || 0) - rect.top;

            const shapeData = {
                shapeType: tool,
                x: shapeStartPos.x,
                y: shapeStartPos.y,
                width: x - shapeStartPos.x,
                height: y - shapeStartPos.y,
                endX: x,
                endY: y,
                color,
                brushSize,
                filled: shapeFilled
            };
            if (['rectangle', 'circle', 'diamond'].includes(tool)) {
                shapeData.x = Math.min(shapeStartPos.x, x);
                shapeData.y = Math.min(shapeStartPos.y, y);
                shapeData.width = Math.abs(x - shapeStartPos.x);
                shapeData.height = Math.abs(y - shapeStartPos.y);
            }
            if (['line', 'arrow'].includes(tool)) {
                shapeData.x = shapeStartPos.x;
                shapeData.y = shapeStartPos.y;
            }

            // Restore canvas and draw final shape
            if (preCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = contextRef.current;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    drawShapeOnCanvas(shapeData);
                    saveToHistory();
                };
                img.src = preCanvasRef.current;
            }

            socketRef.current?.emit('draw-shape', { roomId, shapeData });

            setIsDrawing(false);
            setShapeStartPos(null);
            preCanvasRef.current = null;
            return;
        }

        const ctx = contextRef.current;
        ctx.closePath();
        setIsDrawing(false);

        if (currentStrokeRef.current.length > 1) {
            const stroke = {
                points: currentStrokeRef.current,
                color,
                brushSize: tool === 'eraser' ? brushSize * 3 : brushSize,
                tool,
                userId: user?.id,
                username: user?.username,
                timestamp: new Date()
            };

            socketRef.current?.emit('draw-end', { roomId, stroke });
            saveToHistory();
        }

        currentStrokeRef.current = [];
    };

    // Undo
    const handleUndo = () => {
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        restoreFromHistory(history[newIndex]);
        socketRef.current?.emit('undo', { roomId });
        if (pagesRef.current[currentPage]) {
            pagesRef.current[currentPage].historyIndex = newIndex;
            pagesRef.current[currentPage].imageData = history[newIndex];
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        restoreFromHistory(history[newIndex]);
        socketRef.current?.emit('redo', { roomId });
        if (pagesRef.current[currentPage]) {
            pagesRef.current[currentPage].historyIndex = newIndex;
            pagesRef.current[currentPage].imageData = history[newIndex];
        }
    };

    const restoreFromHistory = (imageData) => {
        const img = new Image();
        img.onload = () => {
            const ctx = contextRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    };

    // Clear board
    const handleClearBoard = () => {
        if (!canDraw) {
            toast.error('You do not have drawing access.', { id: 'no-access' });
            return;
        }
        if (window.confirm('Clear the current page? This action cannot be undone.')) {
            socketRef.current?.emit('clear-board', { roomId });
        }
    };

    // Text tool: commit text to canvas
    const handleTextSubmit = () => {
        if (!textInput.trim() || !textPosition) {
            setTextInput('');
            setTextPosition(null);
            return;
        }

        const textData = {
            text: textInput,
            x: textPosition.x,
            y: textPosition.y,
            fontSize: textFontSize,
            color: color,
            fontFamily: 'Inter, sans-serif'
        };

        drawTextOnCanvas(textData);
        saveToHistory();

        socketRef.current?.emit('add-text', {
            roomId,
            textData
        });

        setTextInput('');
        setTextPosition(null);
    };

    const handleTextKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleTextSubmit();
        }
        if (e.key === 'Escape') {
            setTextInput('');
            setTextPosition(null);
        }
    };

    const handleTextCancel = () => {
        setTextInput('');
        setTextPosition(null);
    };

    // Text box drag handlers
    const handleTextDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingText(true);
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        textDragOffset.current = {
            x: clientX - textPosition.x,
            y: clientY - textPosition.y
        };
    };

    useEffect(() => {
        if (!isDraggingText) return;

        const handleDragMove = (e) => {
            const clientX = e.clientX || e.touches?.[0]?.clientX;
            const clientY = e.clientY || e.touches?.[0]?.clientY;
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;
            setTextPosition({
                x: clientX - textDragOffset.current.x,
                y: clientY - textDragOffset.current.y
            });
        };

        const handleDragEnd = () => {
            setIsDraggingText(false);
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove);
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDraggingText]);

    // Access control handlers
    const handleGrantAccess = (userId) => {
        socketRef.current?.emit('grant-access', { roomId, userId });
        toast.success('Drawing access granted!');
    };

    const handleRevokeAccess = (userId) => {
        socketRef.current?.emit('revoke-access', { roomId, userId });
        toast.success('Drawing access revoked');
    };

    const handleGrantScreenShare = (userId) => {
        socketRef.current?.emit('grant-screen-share', { roomId, userId });
        toast.success('Screen share access granted!');
    };

    const handleRevokeScreenShare = (userId) => {
        socketRef.current?.emit('revoke-screen-share', { roomId, userId });
        toast.success('Screen share access revoked');
    };

    // Chat mute handler
    const handleToggleChatMute = () => {
        socketRef.current?.emit('toggle-chat-mute', { roomId });
    };

    const handleKickParticipant = async (userId) => {
        try {
            const response = await api.put(`/rooms/${roomId}/kick`, { userId });
            setRoom(response.data.room);
            toast.success('Participant removed');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to kick participant');
        }
    };

    const clearCanvas = () => {
        const ctx = contextRef.current;
        if (!ctx) return;
        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    // Save as image
    const handleSaveImage = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `collabboard-${roomId}-page${currentPage + 1}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success(`Page ${currentPage + 1} saved! 📸`);
    };

    // Copy Room ID
    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied!');
    };

    // Chat message
    const handleSendMessage = (content) => {
        if (!content.trim()) return;
        socketRef.current?.emit('send-message', {
            roomId,
            content: content.trim()
        });
    };

    // === MULTI-PAGE FUNCTIONS ===

    // ==================== WEB RTC CALL LOGIC ====================

    const startCall = async (mediaType = 'audio') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mediaType === 'video'
            });

            setLocalStream(stream);
            setIsInCall(true);
            setIsAudioOn(true);
            setIsVideoOn(mediaType === 'video');

            // Find other users in room to connect with
            // In a simple mesh, we send 'call-user' to everyone
            socketRef.current?.emit('call-user', {
                roomId,
                mediaType
            });

            toast.success(`Started ${mediaType} call`);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            toast.error('Could not access microphone or camera');
        }
    };

    const endCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        Object.keys(peerConnections.current).forEach(socketId => {
            closePeerConnection(socketId);
        });

        socketRef.current?.emit('call-ended', { roomId });
        setIsInCall(false);
        setRemoteStreams({});
        toast('Call ended');
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioOn(audioTrack.enabled);
                socketRef.current?.emit('toggle-media', {
                    roomId,
                    audioEnabled: audioTrack.enabled,
                    videoEnabled: isVideoOn
                });
            }
        }
    };

    const toggleVideo = async () => {
        if (localStream) {
            let videoTrack = localStream.getVideoTracks()[0];

            if (!videoTrack && !isVideoOn) {
                // If we don't have a video track, try to get one
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const newTrack = newStream.getVideoTracks()[0];
                    localStream.addTrack(newTrack);
                    videoTrack = newTrack;
                } catch (e) {
                    toast.error('Could not access camera');
                    return;
                }
            }

            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
                // If we turn on video, make sure screen share is off
                if (videoTrack.enabled && isScreenSharing) {
                    setIsScreenSharing(false);
                }
                socketRef.current?.emit('toggle-media', {
                    roomId,
                    audioEnabled: isAudioOn,
                    videoEnabled: videoTrack.enabled
                });
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!isInCall) {
            toast.error('Join the call first to share screen');
            return;
        }

        const canShare = isCurrentUserHost || allowedScreenSharers.includes(user?.id);
        if (!canShare) {
            toast.error('Host must grant you screen share permission');
            return;
        }

        if (isScreenSharing) {
            // Stop Screen Share
            try {
                // Return to normal video if possible, or just stop
                const tracks = localStream.getVideoTracks();
                tracks.forEach(track => {
                    track.stop();
                    localStream.removeTrack(track);
                });

                setIsScreenSharing(false);
                setIsVideoOn(false);

                socketRef.current?.emit('toggle-media', {
                    roomId,
                    audioEnabled: isAudioOn,
                    videoEnabled: false
                });
            } catch (e) {
                console.error('Error stopping screen share:', e);
            }
        } else {
            // Start Screen Share
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false
                });
                const screenTrack = screenStream.getVideoTracks()[0];

                // Handle stop from browser UI
                screenTrack.onended = () => {
                    setIsScreenSharing(false);
                    setIsVideoOn(false);
                    socketRef.current?.emit('toggle-media', {
                        roomId,
                        audioEnabled: isAudioOn,
                        videoEnabled: false
                    });
                };

                // Replace tracks in local stream
                const oldVideoTracks = localStream.getVideoTracks();
                oldVideoTracks.forEach(t => {
                    t.stop();
                    localStream.removeTrack(t);
                });
                localStream.addTrack(screenTrack);

                // Replace tracks in all peer connections
                Object.values(peerConnections.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    } else {
                        pc.addTrack(screenTrack, localStream);
                    }
                });

                setIsScreenSharing(true);
                setIsVideoOn(true);
                socketRef.current?.emit('toggle-media', {
                    roomId,
                    audioEnabled: isAudioOn,
                    videoEnabled: true
                });
                toast.success('Screen sharing started!');
            } catch (err) {
                console.error('Error starting screen share:', err);
                toast.error('Failed to share screen');
            }
        }
    };

    const initiatePeerConnection = (targetSocketId, username, userId, isOffer) => {
        const pc = new RTCPeerConnection(iceServers);
        peerConnections.current[targetSocketId] = pc;

        // Add local tracks
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('webrtc-ice-candidate', {
                    targetSocketId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStreams(prev => ({
                ...prev,
                [targetSocketId]: {
                    stream: event.streams[0],
                    username: username,
                    userId: userId,
                    audioEnabled: true,
                    videoEnabled: true
                }
            }));
        };

        if (isOffer) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socketRef.current?.emit('webrtc-offer', {
                    targetSocketId,
                    offer: offer
                });
            });
        }

        return pc;
    };

    const handleWebRTCOffer = async (data) => {
        // If we get an offer but aren't in call, we should probably join or ignore.
        // For this implementation, if someone calls us, we auto-join if they are persistent
        // but here we only answer if we are already 'in call' state
        if (!isInCall) return;

        const pc = initiatePeerConnection(data.callerSocketId, data.callerName, data.callerId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit('webrtc-answer', {
            targetSocketId: data.callerSocketId,
            answer: answer
        });
    };

    const closePeerConnection = (socketId) => {
        if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
        }
        setRemoteStreams(prev => {
            const newState = { ...prev };
            delete newState[socketId];
            return newState;
        });
    };

    // Auto-connect with anyone already in call when we join the call
    useEffect(() => {
        if (isInCall && onlineUsers.length > 1) {
            // Initiate connection with every other online user
            // In a real app, you'd only connect with those already 'in call'
            onlineUsers.forEach(u => {
                if (u.socketId !== socketRef.current?.id && !peerConnections.current[u.socketId]) {
                    initiatePeerConnection(u.socketId, u.username, u.id, true);
                }
            });
        }
    }, [isInCall, onlineUsers.length]);

    // ==================== VIDEO GRID DRAG LOGIC ====================

    const handleVideoGridDragStart = (e) => {
        // Prevent drag if clicking on a button or interactive element (if any added later)
        if (e.target.closest('button')) return;

        setIsDraggingVideoGrid(true);
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        videoGridDragOffset.current = {
            x: clientX - videoGridPos.x,
            y: clientY - videoGridPos.y
        };
    };

    useEffect(() => {
        const handleDragMove = (e) => {
            if (!isDraggingVideoGrid) return;
            const clientX = e.clientX || e.touches?.[0]?.clientX;
            const clientY = e.clientY || e.touches?.[0]?.clientY;

            // Boundary checks (optional but good)
            let nextX = clientX - videoGridDragOffset.current.x;
            let nextY = clientY - videoGridDragOffset.current.y;

            setVideoGridPos({ x: nextX, y: nextY });
        };

        const handleDragEnd = () => {
            setIsDraggingVideoGrid(false);
        };

        if (isDraggingVideoGrid) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDraggingVideoGrid]);

    const saveCurrentPageState = () => {
        if (!canvasRef.current) return;
        const imageData = canvasRef.current.toDataURL();
        pagesRef.current[currentPage] = {
            imageData,
            history: [...history],
            historyIndex,
        };
    };

    const loadPage = (pageIndex) => {
        const pageData = pagesRef.current[pageIndex];
        if (!pageData) return;

        const img = new Image();
        img.onload = () => {
            const ctx = contextRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = pageData.imageData;

        setHistory(pageData.history);
        setHistoryIndex(pageData.historyIndex);
    };

    const switchToPage = (pageIndex) => {
        if (pageIndex === currentPage || pageIndex < 0 || pageIndex >= totalPages) return;
        saveCurrentPageState();
        setCurrentPage(pageIndex);
        loadPage(pageIndex);
    };

    const addNewPage = () => {
        saveCurrentPageState();

        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const blankData = canvas.toDataURL();

        const newPageIndex = totalPages;
        pagesRef.current.push({
            imageData: blankData,
            history: [blankData],
            historyIndex: 0,
        });
        setTotalPages(newPageIndex + 1);
        setCurrentPage(newPageIndex);
        setHistory([blankData]);
        setHistoryIndex(0);

        toast.success(`Page ${newPageIndex + 1} added! 📄`);
    };

    const deleteCurrentPage = () => {
        if (totalPages <= 1) {
            toast.error('Cannot delete the only page');
            return;
        }
        if (!window.confirm(`Delete Page ${currentPage + 1}?`)) return;

        pagesRef.current.splice(currentPage, 1);
        const newTotal = totalPages - 1;
        setTotalPages(newTotal);

        const newIndex = currentPage >= newTotal ? newTotal - 1 : currentPage;
        setCurrentPage(newIndex);
        loadPage(newIndex);

        toast.success('Page deleted');
    };

    const prevPage = () => {
        if (currentPage > 0) switchToPage(currentPage - 1);
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            switchToPage(currentPage + 1);
        } else {
            addNewPage();
        }
    };

    const handleDownloadAll = () => {
        saveCurrentPageState();
        pagesRef.current.forEach((page, idx) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.download = `collabboard-${roomId}-page${idx + 1}-${Date.now()}.png`;
                link.href = page.imageData;
                link.click();
            }, idx * 300);
        });
        toast.success(`All ${totalPages} pages downloading! 📸`);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading whiteboard...</p>
            </div>
        );
    }

    return (
        <div className="whiteboard-page">
            <div className="whiteboard-main">
                {/* Toolbar */}
                <div className="whiteboard-toolbar">
                    <div className="toolbar-left">
                        <button className="toolbar-back" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft />
                            Back
                        </button>
                        <div className="toolbar-room-info">
                            <span className="toolbar-room-name">{room?.name}</span>
                            <span
                                className="toolbar-room-id"
                                onClick={copyRoomId}
                                title="Click to copy"
                            >
                                <Copy size={10} /> {roomId}
                            </span>
                        </div>
                    </div>

                    <div className="toolbar-center">
                        {/* Drawing Tools */}
                        <button
                            className={`btn-icon ${tool === 'pencil' ? 'active' : ''}`}
                            onClick={() => setTool('pencil')}
                            title="Pencil"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'eraser' ? 'active' : ''}`}
                            onClick={() => setTool('eraser')}
                            title="Eraser"
                        >
                            <Eraser size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'text' ? 'active' : ''}`}
                            onClick={() => setTool('text')}
                            title="Text Tool"
                        >
                            <Type size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Shape Tools */}
                        <button
                            className={`btn-icon ${tool === 'rectangle' ? 'active' : ''}`}
                            onClick={() => setTool('rectangle')}
                            title="Rectangle"
                        >
                            <Square size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'circle' ? 'active' : ''}`}
                            onClick={() => setTool('circle')}
                            title="Circle / Ellipse"
                        >
                            <Circle size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'line' ? 'active' : ''}`}
                            onClick={() => setTool('line')}
                            title="Line"
                        >
                            <Minus size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'arrow' ? 'active' : ''}`}
                            onClick={() => setTool('arrow')}
                            title="Arrow"
                        >
                            <ArrowRight size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'diamond' ? 'active' : ''}`}
                            onClick={() => setTool('diamond')}
                            title="Diamond"
                        >
                            <Diamond size={18} />
                        </button>

                        {/* Fill toggle for shapes */}
                        {isShapeTool && (
                            <button
                                className={`btn-icon fill-toggle ${shapeFilled ? 'active' : ''}`}
                                onClick={() => setShapeFilled(!shapeFilled)}
                                title={shapeFilled ? 'Filled (click for outline)' : 'Outline (click for filled)'}
                            >
                                {shapeFilled ? (
                                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Fill</span>
                                ) : (
                                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Line</span>
                                )}
                            </button>
                        )}

                        {/* Color Picker */}
                        <div className="color-picker-wrapper">
                            <button
                                className="color-picker-btn"
                                style={{ background: color }}
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                title="Color"
                            />
                            {showColorPicker && (
                                <div className="color-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="color-picker-grid">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                className={`color-swatch ${color === c ? 'active' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => { setColor(c); setShowColorPicker(false); }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="color"
                                        className="color-picker-custom"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        title="Custom color"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Brush / Font Size */}
                        {tool === 'text' ? (
                            <div className="brush-size-wrapper">
                                <span className="brush-size-label">Font</span>
                                <input
                                    type="range"
                                    className="brush-size-slider"
                                    min="12"
                                    max="72"
                                    value={textFontSize}
                                    onChange={(e) => setTextFontSize(parseInt(e.target.value))}
                                />
                                <span className="brush-size-value">{textFontSize}px</span>
                            </div>
                        ) : (
                            <div className="brush-size-wrapper">
                                <span className="brush-size-label">Size</span>
                                <input
                                    type="range"
                                    className="brush-size-slider"
                                    min="1"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                />
                                <span className="brush-size-value">{brushSize}</span>
                            </div>
                        )}

                        <div className="toolbar-divider" />

                        {/* Undo/Redo */}
                        <button
                            className="btn-icon"
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            title="Undo"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo"
                        >
                            <Redo2 size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Clear & Save */}
                        <button
                            className="btn-icon"
                            onClick={handleClearBoard}
                            title="Clear Page"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={handleSaveImage}
                            title="Save as Image"
                        >
                            <Download size={18} />
                        </button>
                    </div>

                    <div className="toolbar-right">
                        <button
                            className="toolbar-share-btn"
                            onClick={() => setShareOpen(true)}
                            title="Share Room"
                        >
                            <Share2 size={16} />
                            Share
                        </button>

                        <div className="call-controls">
                            {!isInCall ? (
                                <>
                                    {callPrompt ? (
                                        <button
                                            className="btn-call active"
                                            onClick={() => { startCall(callPrompt.mediaType); setCallPrompt(null); }}
                                            style={{ width: 'auto', padding: '0 12px', gap: '8px', borderRadius: 'var(--radius-md)' }}
                                            title={`Join ${callPrompt.callerName}'s ${callPrompt.mediaType} call`}
                                        >
                                            <Phone size={16} />
                                            <span style={{ fontSize: '11px', fontWeight: 700 }}>Join {callPrompt.callerName}'s Call</span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="btn-call"
                                                onClick={() => startCall('audio')}
                                                title="Start Audio Call"
                                            >
                                                <Mic size={18} />
                                            </button>
                                            <button
                                                className="btn-call"
                                                onClick={() => startCall('video')}
                                                title="Start Video Call"
                                            >
                                                <Video size={18} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        className={`btn-call ${isAudioOn ? 'active' : ''}`}
                                        onClick={toggleMic}
                                        title={isAudioOn ? 'Mute' : 'Unmute'}
                                    >
                                        {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                                    </button>
                                    <button
                                        className={`btn-call ${isVideoOn && !isScreenSharing ? 'active' : ''}`}
                                        onClick={toggleVideo}
                                        title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                                    >
                                        {isVideoOn && !isScreenSharing ? <Video size={18} /> : <VideoOff size={18} />}
                                    </button>
                                    <button
                                        className={`btn-call ${isScreenSharing ? 'active' : ''}`}
                                        onClick={toggleScreenShare}
                                        title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                                    >
                                        {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                                    </button>
                                    <button
                                        className="btn-call danger"
                                        onClick={endCall}
                                        title="End Call"
                                    >
                                        <PhoneOff size={18} />
                                    </button>
                                </>
                            )}
                        </div>

                        <button
                            className="btn-icon"
                            onClick={toggleTheme}
                            title={isDark ? 'Light Mode' : 'Dark Mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                        >
                            {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="canvas-container" ref={containerRef}>
                    <canvas
                        ref={canvasRef}
                        className={!canDraw ? 'no-draw-access' : (tool === 'text' ? 'text-cursor' : (isShapeTool ? 'shape-cursor' : ''))}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />

                    {/* No access overlay */}
                    {!canDraw && (
                        <div className="no-access-overlay">
                            <Lock size={20} />
                            <span>View Only — Ask the host to grant you drawing access</span>
                        </div>
                    )}

                    {/* Video Grid Overlay */}
                    {isInCall && (
                        <div
                            className="video-grid-overlay"
                            onMouseDown={handleVideoGridDragStart}
                            onTouchStart={handleVideoGridDragStart}
                            style={{
                                left: `${videoGridPos.x}px`,
                                top: `${videoGridPos.y}px`
                            }}
                        >
                            {/* Local Video if Video is ON */}
                            {isVideoOn && localStream && (
                                <div className={`video-card local ${isCurrentUserHost ? 'host-card' : ''}`}>
                                    <video
                                        autoPlay
                                        muted
                                        playsInline
                                        ref={el => { if (el) el.srcObject = localStream; }}
                                    />
                                    <div className="video-label">
                                        {isCurrentUserHost && <Crown size={10} style={{ marginRight: '4px' }} />}
                                        You {isCurrentUserHost ? '(Host)' : ''}
                                    </div>
                                    <div className="video-status-icons">
                                        {!isAudioOn && <div className="status-icon-muted"><MicOff size={10} /></div>}
                                    </div>
                                </div>
                            )}

                            {/* Remote Videos */}
                            {Object.entries(remoteStreams).map(([socketId, data]) => {
                                const isUserHost = room?.host?._id === data.userId || room?.host === data.userId;
                                return (
                                    <div key={socketId} className={`video-card ${isUserHost ? 'host-card' : ''}`}>
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={el => { if (el) el.srcObject = data.stream; }}
                                        />
                                        <div className="video-label">
                                            {isUserHost && <Crown size={10} style={{ marginRight: '4px' }} />}
                                            {data.username} {isUserHost ? '(Host)' : ''}
                                        </div>
                                        <div className="video-status-icons">
                                            {!data.audioEnabled && <div className="status-icon-muted"><MicOff size={10} /></div>}
                                            {!data.videoEnabled && <div className="status-icon-muted"><VideoOff size={10} /></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Text input overlay */}
                    {textPosition && canDraw && (
                        <div
                            className="text-input-overlay"
                            style={{
                                left: textPosition.x,
                                top: textPosition.y,
                            }}
                        >
                            <div
                                className="text-drag-handle"
                                onMouseDown={handleTextDragStart}
                                onTouchStart={handleTextDragStart}
                                title="Drag to move"
                            >
                                <GripVertical size={14} />
                            </div>
                            <div className="text-input-container">
                                <textarea
                                    ref={textInputRef}
                                    className="canvas-text-input"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={handleTextKeyDown}
                                    placeholder="Type here..."
                                    rows={Math.max(1, textInput.split('\n').length)}
                                    style={{
                                        fontSize: `${textFontSize}px`,
                                        color: color,
                                        lineHeight: '1.3',
                                    }}
                                    autoFocus
                                />
                                <div className="text-input-hint">
                                    Ctrl+Enter to save · Esc to cancel
                                </div>
                            </div>
                            <div className="text-input-actions">
                                <button
                                    className="text-action-btn confirm"
                                    onClick={(e) => { e.stopPropagation(); handleTextSubmit(); }}
                                    title="Save text (Ctrl+Enter)"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    className="text-action-btn cancel"
                                    onClick={(e) => { e.stopPropagation(); handleTextCancel(); }}
                                    title="Cancel (Esc)"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Remote Cursors */}
                    {Object.entries(remoteCursors).map(([userId, cursor]) => {
                        if (userId === user?.id) return null;
                        return (
                            <div
                                key={userId}
                                className="remote-cursor"
                                style={{
                                    left: cursor.x,
                                    top: cursor.y
                                }}
                            >
                                <div className="remote-cursor-pointer" />
                                <span className="remote-cursor-label">{cursor.username}</span>
                            </div>
                        );
                    })}

                    {/* Page Navigator */}
                    <div className="page-navigator">
                        <button
                            className="page-nav-btn"
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="page-nav-pages">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    className={`page-nav-dot ${i === currentPage ? 'active' : ''}`}
                                    onClick={() => switchToPage(i)}
                                    title={`Page ${i + 1}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            className="page-nav-btn"
                            onClick={nextPage}
                            title={currentPage === totalPages - 1 ? "Add New Page" : "Next Page"}
                        >
                            {currentPage === totalPages - 1 ? <Plus size={16} /> : <ChevronRight size={16} />}
                        </button>

                        <div className="page-nav-divider" />

                        <button
                            className="page-nav-btn add-page-btn"
                            onClick={addNewPage}
                            title="Add New Page"
                        >
                            <FilePlus size={16} />
                        </button>

                        {totalPages > 1 && (
                            <button
                                className="page-nav-btn delete-page-btn"
                                onClick={deleteCurrentPage}
                                title="Delete Current Page"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}

                        <div className="page-nav-divider" />

                        <span className="page-nav-info">
                            <Layers size={14} />
                            {currentPage + 1} / {totalPages}
                        </span>

                        {totalPages > 1 && (
                            <button
                                className="page-nav-btn download-all-btn"
                                onClick={handleDownloadAll}
                                title="Download All Pages"
                            >
                                <Download size={14} />
                                All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-tabs">
                    <button
                        className={`sidebar-tab ${sidebarTab === 'chat' ? 'active' : ''}`}
                        onClick={() => { setSidebarTab('chat'); setUnreadMessages(0); }}
                    >
                        <MessageSquare size={16} />
                        Chat
                        {unreadMessages > 0 && (
                            <span className="badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                        )}
                    </button>
                    <button
                        className={`sidebar-tab ${sidebarTab === 'users' ? 'active' : ''}`}
                        onClick={() => setSidebarTab('users')}
                    >
                        <Users size={16} />
                        Users ({onlineUsers.length})
                    </button>
                </div>

                {sidebarTab === 'chat' ? (
                    <ChatPanel
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        currentUser={user}
                        chatMuted={chatMuted}
                        isHost={isCurrentUserHost}
                        onToggleChatMute={handleToggleChatMute}
                    />
                ) : (
                    <UsersPanel
                        users={onlineUsers}
                        currentUser={user}
                        room={room}
                        allowedDrawers={allowedDrawers}
                        allowedScreenSharers={allowedScreenSharers}
                        onGrantAccess={handleGrantAccess}
                        onRevokeAccess={handleRevokeAccess}
                        onGrantScreenShare={handleGrantScreenShare}
                        onRevokeScreenShare={handleRevokeScreenShare}
                        onKickUser={handleKickParticipant}
                        isCurrentUserHost={isCurrentUserHost}
                    />
                )}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                roomId={roomId}
                roomName={room?.name || 'Whiteboard'}
            />
        </div>
    );
};

export default WhiteboardPage;
