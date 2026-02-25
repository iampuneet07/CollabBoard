import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Pencil, Eraser, Trash2, Undo2, Redo2,
    Download, Share2, Sun, Moon, Square, Circle, Type,
    Minus, Image as ImageIcon, X, Check, Copy, Link2,
    Mail, Hash, Plus, ChevronLeft, ChevronRight, FilePlus, Layers
} from 'lucide-react';

const COLORS = [
    '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7',
    '#ec4899', '#f97316', '#14b8a6', '#06b6d4', '#8b5cf6', '#6366f1',
    '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#fbbf24', '#34d399'
];

const SimpleWhiteboard = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const containerRef = useRef(null);

    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Undo/Redo
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const currentStrokeRef = useRef([]);
    const shapeStartRef = useRef(null);
    const snapshotBeforeShapeRef = useRef(null);

    // Shape tool state
    const [shapeTool, setShapeTool] = useState(null); // 'rect', 'circle', 'line'

    // Text tool
    const [textInput, setTextInput] = useState(null);

    // Multi-page state
    const [pages, setPages] = useState([]); // Array of { imageData, history, historyIndex }
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pagesRef = useRef([]); // Keep in sync for save/load

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

        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [isDark]);

    useEffect(() => {
        initCanvas();
        // Save initial state for page 1
        setTimeout(() => {
            if (canvasRef.current) {
                const imageData = canvasRef.current.toDataURL();
                setHistory([imageData]);
                setHistoryIndex(0);
                // Initialize pages array
                pagesRef.current = [{
                    imageData,
                    history: [imageData],
                    historyIndex: 0
                }];
                setPages([...pagesRef.current]);
            }
        }, 100);

        const handleResize = () => {
            const imageData = canvasRef.current?.toDataURL();
            initCanvas();
            if (imageData) {
                const img = new Image();
                img.onload = () => {
                    contextRef.current?.drawImage(img, 0, 0);
                };
                img.src = imageData;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initCanvas]);

    // Save canvas state to history
    const saveToHistory = useCallback(() => {
        if (!canvasRef.current) return;
        const imageData = canvasRef.current.toDataURL();
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(imageData);
            const trimmed = newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
            // Also update the page data
            const newIdx = Math.min(historyIndex + 1, 49);
            if (pagesRef.current[currentPage]) {
                pagesRef.current[currentPage] = {
                    imageData,
                    history: trimmed,
                    historyIndex: newIdx,
                };
                setPages([...pagesRef.current]);
            }
            return trimmed;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex, currentPage]);

    const restoreFromHistory = (imageData) => {
        const img = new Image();
        img.onload = () => {
            const ctx = contextRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    };

    // Active tool
    const activeTool = shapeTool || tool;

    // Drawing handlers
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        return { x, y };
    };

    const startDrawing = (e) => {
        if (textInput) return;
        const { x, y } = getCoords(e);
        const ctx = contextRef.current;

        if (shapeTool) {
            // For shapes, save snapshot before drawing
            shapeStartRef.current = { x, y };
            snapshotBeforeShapeRef.current = canvasRef.current.toDataURL();
            setIsDrawing(true);
            return;
        }

        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? (isDark ? '#1a1a2e' : '#ffffff') : color;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        ctx.moveTo(x, y);

        setIsDrawing(true);
        currentStrokeRef.current = [{ x, y }];
    };

    const draw = (e) => {
        if (!isDrawing || textInput) return;
        const { x, y } = getCoords(e);
        const ctx = contextRef.current;

        if (shapeTool) {
            // Restore snapshot, then draw shape preview
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(img, 0, 0);
                drawShapePreview(ctx, shapeStartRef.current, { x, y });
            };
            img.src = snapshotBeforeShapeRef.current;
            return;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        currentStrokeRef.current.push({ x, y });
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;

        if (shapeTool && shapeStartRef.current) {
            const { x, y } = getCoords(e);
            const ctx = contextRef.current;
            // Restore then draw final shape
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(img, 0, 0);
                drawShapePreview(ctx, shapeStartRef.current, { x, y });
                saveToHistory();
            };
            img.src = snapshotBeforeShapeRef.current;
            shapeStartRef.current = null;
            snapshotBeforeShapeRef.current = null;
            setIsDrawing(false);
            return;
        }

        contextRef.current.closePath();
        setIsDrawing(false);

        if (currentStrokeRef.current.length > 1) {
            saveToHistory();
        }
        currentStrokeRef.current = [];
    };

    // Shape drawing
    const drawShapePreview = (ctx, start, end) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (shapeTool === 'rect') {
            const w = end.x - start.x;
            const h = end.y - start.y;
            ctx.strokeRect(start.x, start.y, w, h);
        } else if (shapeTool === 'circle') {
            const rx = Math.abs(end.x - start.x) / 2;
            const ry = Math.abs(end.y - start.y) / 2;
            const cx = start.x + (end.x - start.x) / 2;
            const cy = start.y + (end.y - start.y) / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (shapeTool === 'line') {
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    };

    // Text tool
    const handleCanvasClick = (e) => {
        if (tool === 'text' && !shapeTool) {
            const { x, y } = getCoords(e);
            setTextInput({ x, y, value: '' });
        }
    };

    const placeText = () => {
        if (!textInput || !textInput.value.trim()) {
            setTextInput(null);
            return;
        }
        const ctx = contextRef.current;
        ctx.font = `${brushSize * 5}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(textInput.value, textInput.x, textInput.y);
        setTextInput(null);
        saveToHistory();
    };

    // Undo
    const handleUndo = () => {
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        restoreFromHistory(history[newIndex]);
        // Update page ref
        if (pagesRef.current[currentPage]) {
            pagesRef.current[currentPage].historyIndex = newIndex;
            pagesRef.current[currentPage].imageData = history[newIndex];
            setPages([...pagesRef.current]);
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        restoreFromHistory(history[newIndex]);
        // Update page ref
        if (pagesRef.current[currentPage]) {
            pagesRef.current[currentPage].historyIndex = newIndex;
            pagesRef.current[currentPage].imageData = history[newIndex];
            setPages([...pagesRef.current]);
        }
    };

    // Clear
    const handleClearBoard = () => {
        if (window.confirm('Clear the current page?')) {
            const ctx = contextRef.current;
            ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveToHistory();
        }
    };

    // === MULTI-PAGE FUNCTIONS ===

    // Save current page state before switching
    const saveCurrentPageState = () => {
        if (!canvasRef.current) return;
        const imageData = canvasRef.current.toDataURL();
        pagesRef.current[currentPage] = {
            imageData,
            history: [...history],
            historyIndex,
        };
        setPages([...pagesRef.current]);
    };

    // Load a page onto the canvas
    const loadPage = (pageIndex) => {
        const pageData = pagesRef.current[pageIndex];
        if (!pageData) return;

        // Restore canvas
        const img = new Image();
        img.onload = () => {
            const ctx = contextRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = pageData.imageData;

        // Restore history for this page
        setHistory(pageData.history);
        setHistoryIndex(pageData.historyIndex);
    };

    // Switch to a different page
    const switchToPage = (pageIndex) => {
        if (pageIndex === currentPage || pageIndex < 0 || pageIndex >= totalPages) return;

        // Save current page
        saveCurrentPageState();

        // Switch
        setCurrentPage(pageIndex);
        loadPage(pageIndex);
    };

    // Add a new blank page
    const addNewPage = () => {
        // Save current page first
        saveCurrentPageState();

        // Create blank canvas data
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const blankData = canvas.toDataURL();

        // Add to pages array
        const newPageIndex = totalPages;
        pagesRef.current.push({
            imageData: blankData,
            history: [blankData],
            historyIndex: 0,
        });
        setPages([...pagesRef.current]);
        setTotalPages(newPageIndex + 1);

        // Switch to the new page
        setCurrentPage(newPageIndex);
        setHistory([blankData]);
        setHistoryIndex(0);

        toast.success(`Page ${newPageIndex + 1} added! 📄`);
    };

    // Delete current page (only if more than 1)
    const deleteCurrentPage = () => {
        if (totalPages <= 1) {
            toast.error('Cannot delete the only page');
            return;
        }
        if (!window.confirm(`Delete Page ${currentPage + 1}?`)) return;

        pagesRef.current.splice(currentPage, 1);
        const newTotal = totalPages - 1;
        setTotalPages(newTotal);

        // Decide which page to show
        const newIndex = currentPage >= newTotal ? newTotal - 1 : currentPage;
        setCurrentPage(newIndex);
        setPages([...pagesRef.current]);
        loadPage(newIndex);

        toast.success('Page deleted');
    };

    // Go to previous page
    const prevPage = () => {
        if (currentPage > 0) switchToPage(currentPage - 1);
    };

    // Go to next page
    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            switchToPage(currentPage + 1);
        } else {
            // If on last page, add new
            addNewPage();
        }
    };

    // Download all pages as individual PNGs or just current
    const handleDownload = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `whiteboard-page${currentPage + 1}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success(`Page ${currentPage + 1} downloaded! 📸`);
    };

    // Download all pages
    const handleDownloadAll = () => {
        // Save current page first
        saveCurrentPageState();

        pagesRef.current.forEach((page, idx) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.download = `whiteboard-page${idx + 1}-${Date.now()}.png`;
                link.href = page.imageData;
                link.click();
            }, idx * 300);
        });
        toast.success(`All ${totalPages} pages downloading! 📸`);
    };

    // Share image
    const handleShareImage = async () => {
        const canvas = canvasRef.current;

        // Check if Web Share API with files is supported
        if (navigator.canShare) {
            try {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'My Whiteboard Drawing',
                        text: 'Check out my whiteboard drawing from CollabBoard!',
                        files: [file],
                    });
                    return;
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        // Fallback: show share options modal
        setShowShareModal(true);
    };

    // Copy image to clipboard
    const handleCopyImage = async () => {
        try {
            const canvas = canvasRef.current;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Image copied to clipboard! 📋');
        } catch {
            toast.error('Could not copy image. Try downloading instead.');
        }
    };

    // Share via email
    const handleEmailShare = () => {
        const subject = encodeURIComponent('My Whiteboard Drawing - CollabBoard');
        const body = encodeURIComponent(
            `Check out my whiteboard drawing!\n\nTip: Download the image from CollabBoard and attach it to your email.`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        toast.success('Opening email client...');
    };

    // Download then open WhatsApp
    const handleWhatsAppShare = () => {
        handleDownload();
        setTimeout(() => {
            const msg = encodeURIComponent('Check out my whiteboard drawing from CollabBoard! 🎨');
            window.open(`https://wa.me/?text=${msg}`, '_blank');
        }, 500);
    };

    const selectTool = (t) => {
        setTool(t);
        setShapeTool(null);
        setTextInput(null);
    };

    const selectShape = (s) => {
        setShapeTool(s);
        setTool('pencil');
        setTextInput(null);
    };

    return (
        <div className="whiteboard-page simple-whiteboard">
            <div className="whiteboard-main">
                {/* Toolbar */}
                <div className="whiteboard-toolbar">
                    <div className="toolbar-left">
                        <button className="toolbar-back" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft />
                            Back
                        </button>
                        <div className="toolbar-room-info">
                            <span className="toolbar-room-name">✏️ My Whiteboard</span>
                            <span className="simple-badge">Personal</span>
                        </div>
                    </div>

                    <div className="toolbar-center">
                        {/* Drawing Tools */}
                        <button
                            className={`btn-icon ${activeTool === 'pencil' && !shapeTool ? 'active' : ''}`}
                            onClick={() => selectTool('pencil')}
                            title="Pencil"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'eraser' ? 'active' : ''}`}
                            onClick={() => selectTool('eraser')}
                            title="Eraser"
                        >
                            <Eraser size={18} />
                        </button>
                        <button
                            className={`btn-icon ${tool === 'text' && !shapeTool ? 'active' : ''}`}
                            onClick={() => selectTool('text')}
                            title="Text"
                        >
                            <Type size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Shape Tools */}
                        <button
                            className={`btn-icon ${shapeTool === 'rect' ? 'active' : ''}`}
                            onClick={() => selectShape('rect')}
                            title="Rectangle"
                        >
                            <Square size={18} />
                        </button>
                        <button
                            className={`btn-icon ${shapeTool === 'circle' ? 'active' : ''}`}
                            onClick={() => selectShape('circle')}
                            title="Circle"
                        >
                            <Circle size={18} />
                        </button>
                        <button
                            className={`btn-icon ${shapeTool === 'line' ? 'active' : ''}`}
                            onClick={() => selectShape('line')}
                            title="Line"
                        >
                            <Minus size={18} />
                        </button>

                        <div className="toolbar-divider" />

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

                        {/* Brush Size */}
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

                        <div className="toolbar-divider" />

                        {/* Undo/Redo */}
                        <button
                            className="btn-icon"
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Clear */}
                        <button className="btn-icon" onClick={handleClearBoard} title="Clear Page">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="toolbar-right">
                        {/* Download */}
                        <button
                            className="btn-icon tooltip"
                            data-tooltip="Download PNG"
                            onClick={handleDownload}
                            title="Download current page as PNG"
                        >
                            <Download size={18} />
                        </button>

                        {/* Share Image */}
                        <button
                            className="toolbar-share-btn"
                            onClick={handleShareImage}
                            title="Share Whiteboard Image"
                        >
                            <Share2 size={16} />
                            Share
                        </button>

                        <button
                            className="btn-icon"
                            onClick={toggleTheme}
                            title={isDark ? 'Light Mode' : 'Dark Mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="canvas-container" ref={containerRef}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        onClick={handleCanvasClick}
                        style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
                    />

                    {/* Text Input Overlay */}
                    {textInput && (
                        <div
                            className="text-input-overlay"
                            style={{ left: textInput.x, top: textInput.y }}
                        >
                            <input
                                type="text"
                                className="canvas-text-input"
                                autoFocus
                                placeholder="Type here..."
                                value={textInput.value}
                                onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') placeText();
                                    if (e.key === 'Escape') setTextInput(null);
                                }}
                                style={{
                                    color: color,
                                    fontSize: `${brushSize * 5}px`,
                                }}
                            />
                            <div className="text-input-actions">
                                <button className="text-action-btn confirm" onClick={placeText} title="Place text">
                                    <Check size={14} />
                                </button>
                                <button className="text-action-btn cancel" onClick={() => setTextInput(null)} title="Cancel">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

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

            {/* Share Image Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal share-image-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <div className="share-modal-title-row">
                                <div className="share-modal-icon">
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <h3>Share Whiteboard Image</h3>
                                    <p className="share-modal-subtitle">Share your drawing with others</p>
                                </div>
                            </div>
                            <button className="share-close-btn" onClick={() => setShowShareModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Image preview */}
                        <div className="share-image-preview">
                            <img
                                src={canvasRef.current?.toDataURL('image/png')}
                                alt="Whiteboard preview"
                            />
                        </div>

                        {/* Actions */}
                        <div className="share-apps">
                            <label>Actions</label>
                            <div className="share-apps-row">
                                <button className="share-app-btn" onClick={handleDownload} title="Download">
                                    <Download size={20} />
                                    <span>Download</span>
                                </button>
                                <button className="share-app-btn" onClick={handleCopyImage} title="Copy">
                                    <Copy size={20} />
                                    <span>Copy</span>
                                </button>
                                <button className="share-app-btn whatsapp" onClick={handleWhatsAppShare} title="WhatsApp">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    <span>WhatsApp</span>
                                </button>
                                <button className="share-app-btn email" onClick={handleEmailShare} title="Email">
                                    <Mail size={20} />
                                    <span>Email</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleWhiteboard;
