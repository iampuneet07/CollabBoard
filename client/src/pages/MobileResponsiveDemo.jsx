import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
    ArrowLeft, Home, Pencil, MessageSquare, Users, Settings,
    Sun, Moon, ChevronRight, ChevronLeft, Palette, Menu, X,
    Download, Share2, Undo2, Redo2, Trash2, Eraser,
    Monitor, Smartphone, Tablet, Info
} from 'lucide-react';

const MobileResponsiveDemo = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');
    const [previewMode, setPreviewMode] = useState('phone'); // phone, tablet, desktop

    const sections = [
        { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
        { id: 'navigation', label: 'Bottom Navigation', icon: <Home size={16} /> },
        { id: 'sidebar', label: 'Collapsible Sidebar', icon: <ChevronRight size={16} /> },
        { id: 'touch', label: 'Touch Optimizations', icon: <Smartphone size={16} /> },
        { id: 'toolbar', label: 'Adaptive Toolbar', icon: <Pencil size={16} /> },
        { id: 'responsive', label: 'Responsive Grid', icon: <Monitor size={16} /> },
    ];

    const previewSizes = {
        phone: { width: 375, height: 667, label: 'iPhone SE' },
        tablet: { width: 768, height: 1024, label: 'iPad' },
        desktop: { width: '100%', height: 600, label: 'Desktop' },
    };

    return (
        <div className="demo-page">
            {/* Header */}
            <nav className="demo-nav">
                <div className="demo-nav-left">
                    <button className="toolbar-back" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft />
                        Dashboard
                    </button>
                    <div className="demo-nav-title">
                        <Smartphone size={18} />
                        <h2>Mobile Responsive Demo</h2>
                    </div>
                </div>
                <div className="demo-nav-right">
                    <button
                        className="btn-icon tooltip"
                        data-tooltip={isDark ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </nav>

            <div className="demo-layout">
                {/* Section Sidebar */}
                <aside className={`demo-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="demo-sidebar-header">
                        <h3>UI Patterns</h3>
                        <button className="demo-sidebar-close" onClick={() => setSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            className={`demo-sidebar-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => { setActiveSection(s.id); setSidebarOpen(false); }}
                        >
                            {s.icon}
                            <span>{s.label}</span>
                            <ChevronRight size={14} className="demo-sidebar-arrow" />
                        </button>
                    ))}
                </aside>

                {/* Sidebar overlay for mobile */}
                {sidebarOpen && (
                    <div className="demo-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Main content */}
                <main className="demo-content">
                    {/* Mobile menu button */}
                    <button className="demo-menu-btn" onClick={() => setSidebarOpen(true)}>
                        <Menu size={18} />
                        Sections
                    </button>

                    {/* Overview */}
                    {activeSection === 'overview' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>📱 Mobile Responsive UI Patterns</h2>
                                <p>This demo showcases mobile-specific UI patterns used throughout CollabBoard, including bottom navigation, collapsible sidebars, and touch-optimized interactions.</p>
                            </div>

                            <div className="demo-features-grid">
                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
                                        <Home size={24} />
                                    </div>
                                    <h4>Bottom Navigation</h4>
                                    <p>Tab bar at the bottom of the screen for primary navigation on mobile devices. Fixed position, touch-friendly 48px minimum target size.</p>
                                </div>

                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                                        <ChevronLeft size={24} />
                                    </div>
                                    <h4>Collapsible Sidebar</h4>
                                    <p>Sidebar that slides in from the left on mobile with a backdrop overlay. Replaces the persistent desktop sidebar for smaller screens.</p>
                                </div>

                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                                        <Smartphone size={24} />
                                    </div>
                                    <h4>Touch Optimizations</h4>
                                    <p>Larger tap targets (min 44×44px), swipe gestures, momentum scrolling, and no-hover-needed interactions for mobile users.</p>
                                </div>

                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                                        <Pencil size={24} />
                                    </div>
                                    <h4>Adaptive Toolbar</h4>
                                    <p>Drawing toolbar that wraps and scrolls horizontally on smaller screens. Priority tools are always visible with overflow accessible via scroll.</p>
                                </div>

                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                                        <Monitor size={24} />
                                    </div>
                                    <h4>Responsive Grid</h4>
                                    <p>Room cards, action cards, and layouts that adapt from multi-column desktop grids to single-column mobile stacks.</p>
                                </div>

                                <div className="demo-feature-card">
                                    <div className="demo-feature-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}>
                                        <Palette size={24} />
                                    </div>
                                    <h4>Theme System</h4>
                                    <p>Dark & Light mode with CSS variables, smooth transitions, and system preference detection via prefers-color-scheme.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation Demo */}
                    {activeSection === 'navigation' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>Bottom Navigation Bar</h2>
                                <p>A fixed bottom tab bar used on mobile screens (&lt;768px) for primary navigation. Each tab has a 48px touch target with icon + label.</p>
                            </div>

                            <div className="demo-code-info">
                                <h4>📐 Implementation Details</h4>
                                <ul>
                                    <li><strong>Position:</strong> Fixed at viewport bottom</li>
                                    <li><strong>Height:</strong> 64px (with safe-area-inset-bottom for notched devices)</li>
                                    <li><strong>Backdrop:</strong> Glassmorphism with blur(20px)</li>
                                    <li><strong>Active indicator:</strong> Accent color dot below icon</li>
                                    <li><strong>Breakpoint:</strong> Shown on screens ≤768px</li>
                                </ul>
                            </div>

                            <div className="demo-preview-container">
                                <div className="demo-preview-header">
                                    <span>Live Preview</span>
                                    <div className="demo-device-switcher">
                                        {['phone', 'tablet', 'desktop'].map((d) => (
                                            <button
                                                key={d}
                                                className={`demo-device-btn ${previewMode === d ? 'active' : ''}`}
                                                onClick={() => setPreviewMode(d)}
                                            >
                                                {d === 'phone' && <Smartphone size={14} />}
                                                {d === 'tablet' && <Tablet size={14} />}
                                                {d === 'desktop' && <Monitor size={14} />}
                                                {previewSizes[d].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="demo-preview-frame"
                                    style={{
                                        width: previewSizes[previewMode].width,
                                        height: previewSizes[previewMode].height,
                                        maxWidth: '100%',
                                    }}
                                >
                                    <div className="demo-mobile-app">
                                        <div className="demo-mobile-header">
                                            <Palette size={18} />
                                            <span>CollabBoard</span>
                                        </div>
                                        <div className="demo-mobile-content">
                                            <div className="demo-placeholder-card" />
                                            <div className="demo-placeholder-card" />
                                            <div className="demo-placeholder-card short" />
                                        </div>
                                        <nav className="demo-bottom-nav">
                                            {[
                                                { id: 'home', icon: <Home size={20} />, label: 'Home' },
                                                { id: 'draw', icon: <Pencil size={20} />, label: 'Draw' },
                                                { id: 'chat', icon: <MessageSquare size={20} />, label: 'Chat' },
                                                { id: 'users', icon: <Users size={20} />, label: 'Users' },
                                                { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    className={`demo-bottom-tab ${activeTab === tab.id ? 'active' : ''}`}
                                                    onClick={() => setActiveTab(tab.id)}
                                                >
                                                    {tab.icon}
                                                    <span>{tab.label}</span>
                                                    {activeTab === tab.id && <span className="demo-tab-dot" />}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collapsible Sidebar Demo */}
                    {activeSection === 'sidebar' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>Collapsible Sidebar</h2>
                                <p>On mobile, the chat/users sidebar collapses and slides in from the right with a backdrop overlay. On desktop, it remains visible.</p>
                            </div>

                            <div className="demo-code-info">
                                <h4>📐 Implementation Details</h4>
                                <ul>
                                    <li><strong>Desktop:</strong> Fixed sidebar at {`var(--sidebar-width): 320px`}</li>
                                    <li><strong>Mobile:</strong> Full-width overlay with slide-in animation</li>
                                    <li><strong>Toggle:</strong> Panel button in toolbar</li>
                                    <li><strong>Backdrop:</strong> Semi-transparent overlay, tap to close</li>
                                    <li><strong>Transition:</strong> 300ms ease with transform</li>
                                </ul>
                            </div>

                            <div className="demo-preview-container">
                                <div className="demo-preview-header">
                                    <span>Sidebar Behavior</span>
                                </div>
                                <div className="demo-preview-frame" style={{ width: 375, height: 500, maxWidth: '100%' }}>
                                    <div className="demo-mobile-app">
                                        <div className="demo-mobile-header">
                                            <span>Whiteboard Room</span>
                                            <button className="demo-sidebar-toggle" onClick={() => setSidebarOpen(s => !s)}>
                                                {sidebarOpen ? <X size={16} /> : <MessageSquare size={16} />}
                                            </button>
                                        </div>
                                        <div className="demo-mobile-content" style={{ background: isDark ? '#1a1a2e' : '#f0f0f0' }}>
                                            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                Canvas Area
                                            </div>
                                        </div>
                                        <div className={`demo-slide-sidebar ${sidebarOpen ? 'open' : ''}`}>
                                            <div className="demo-slide-sidebar-tabs">
                                                <button className="active"><MessageSquare size={14} /> Chat</button>
                                                <button><Users size={14} /> Users</button>
                                            </div>
                                            <div className="demo-slide-sidebar-content">
                                                <div className="demo-chat-bubble">Hello team! 👋</div>
                                                <div className="demo-chat-bubble self">Let's start drawing</div>
                                                <div className="demo-chat-bubble">Sounds good! 🎨</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Touch Optimizations */}
                    {activeSection === 'touch' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>Touch Optimizations</h2>
                                <p>UI elements are designed for touch input with larger tap targets, appropriate spacing, and no hover-dependent states on mobile.</p>
                            </div>

                            <div className="demo-touch-grid">
                                <div className="demo-touch-card">
                                    <h4>🎯 Minimum Tap Target</h4>
                                    <p>All interactive elements have a minimum size of <strong>44×44px</strong> as recommended by Apple's HIG and Material Design.</p>
                                    <div className="demo-tap-demo">
                                        <div className="demo-tap-target good">
                                            <span>44px</span>
                                        </div>
                                        <div className="demo-tap-target bad">
                                            <span>24px</span>
                                        </div>
                                    </div>
                                    <div className="demo-tap-labels">
                                        <span className="good-label">✅ Good</span>
                                        <span className="bad-label">❌ Too small</span>
                                    </div>
                                </div>

                                <div className="demo-touch-card">
                                    <h4>📱 Touch Canvas Events</h4>
                                    <p>Canvas supports both mouse and touch events for cross-device drawing:</p>
                                    <div className="demo-code-block">
                                        <code>
                                            onTouchStart={'{startDrawing}'}<br />
                                            onTouchMove={'{draw}'}<br />
                                            onTouchEnd={'{stopDrawing}'}<br />
                                            onMouseDown={'{startDrawing}'}<br />
                                            onMouseMove={'{draw}'}<br />
                                            onMouseUp={'{stopDrawing}'}
                                        </code>
                                    </div>
                                </div>

                                <div className="demo-touch-card">
                                    <h4>📏 Spacing Guidelines</h4>
                                    <p>Touch-friendly spacing between interactive elements:</p>
                                    <div className="demo-spacing-demo">
                                        <div className="demo-spacing-row">
                                            <div className="demo-spacing-box" />
                                            <div className="demo-spacing-gap">8px</div>
                                            <div className="demo-spacing-box" />
                                            <div className="demo-spacing-gap">8px</div>
                                            <div className="demo-spacing-box" />
                                        </div>
                                        <span className="demo-spacing-label">Minimum 8px gap between touch targets</span>
                                    </div>
                                </div>

                                <div className="demo-touch-card">
                                    <h4>🔄 Momentum Scrolling</h4>
                                    <p>Smooth scrolling enabled on all scrollable containers:</p>
                                    <div className="demo-code-block">
                                        <code>
                                            -webkit-overflow-scrolling: touch;<br />
                                            scroll-behavior: smooth;<br />
                                            overscroll-behavior: contain;
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Adaptive Toolbar */}
                    {activeSection === 'toolbar' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>Adaptive Toolbar</h2>
                                <p>The whiteboard toolbar adapts to screen width — tools wrap and become horizontally scrollable on smaller screens.</p>
                            </div>

                            <div className="demo-code-info">
                                <h4>📐 Breakpoint Behavior</h4>
                                <ul>
                                    <li><strong>Desktop (&gt;900px):</strong> All tools visible in single row</li>
                                    <li><strong>Tablet (600–900px):</strong> Tools scroll horizontally</li>
                                    <li><strong>Mobile (&lt;600px):</strong> Toolbar wraps, tools in second row</li>
                                </ul>
                            </div>

                            <div className="demo-preview-container">
                                <div className="demo-preview-header">
                                    <span>Toolbar Preview</span>
                                </div>
                                <div className="demo-toolbar-preview">
                                    <div className="demo-toolbar-row">
                                        <div className="demo-tool active"><Pencil size={16} /></div>
                                        <div className="demo-tool"><Eraser size={16} /></div>
                                        <div className="demo-tool-sep" />
                                        <div className="demo-tool" style={{ background: '#ef4444', width: 24, height: 24, borderRadius: 6 }} />
                                        <div className="demo-tool-slider">
                                            <span>Size</span>
                                            <div className="demo-slider-track"><div className="demo-slider-fill" /></div>
                                            <span>3</span>
                                        </div>
                                        <div className="demo-tool-sep" />
                                        <div className="demo-tool"><Undo2 size={16} /></div>
                                        <div className="demo-tool"><Redo2 size={16} /></div>
                                        <div className="demo-tool-sep" />
                                        <div className="demo-tool"><Trash2 size={16} /></div>
                                        <div className="demo-tool"><Download size={16} /></div>
                                        <div className="demo-tool"><Share2 size={16} /></div>
                                    </div>
                                    <p className="demo-toolbar-hint">↔ Scrolls horizontally on mobile</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Responsive Grid */}
                    {activeSection === 'responsive' && (
                        <div className="demo-section">
                            <div className="demo-section-header">
                                <h2>Responsive Grid System</h2>
                                <p>All grid layouts use CSS Grid with auto-fill and minmax for fluid responsive behavior without explicit breakpoints.</p>
                            </div>

                            <div className="demo-code-info">
                                <h4>📐 Grid Pattern</h4>
                                <div className="demo-code-block" style={{ marginTop: 12 }}>
                                    <code>
                                        grid-template-columns:<br />
                                        &nbsp;&nbsp;repeat(auto-fill, minmax(300px, 1fr));
                                    </code>
                                </div>
                            </div>

                            <div className="demo-grid-showcase">
                                <h4>Room Cards Grid</h4>
                                <div className="demo-grid-preview">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="demo-grid-card">
                                            <div className="demo-grid-card-header">
                                                <span>Room {i}</span>
                                                <span className="demo-grid-badge">LIVE</span>
                                            </div>
                                            <div className="demo-grid-card-meta">
                                                <span><Users size={12} /> {i + 1} users</span>
                                                <span className="demo-grid-dot" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="demo-grid-hint">Resize browser to see cards reflow</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MobileResponsiveDemo;
