# 🎨 CollabBoard — Wireframe & Design System Documentation

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing Scale](#spacing-scale)
- [Border Radius](#border-radius)
- [Shadows & Elevation](#shadows--elevation)
- [Component Patterns](#component-patterns)
- [Layout System](#layout-system)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Animation & Transitions](#animation--transitions)
- [Wireframe Specifications](#wireframe-specifications)
- [Accessibility](#accessibility)

---

## Design Philosophy

CollabBoard follows a **modern glassmorphism** design language with:
- **Dark-first design** with full light mode support
- **Gradient accents** for key interactive elements
- **Frosted glass surfaces** using backdrop-filter
- **Subtle micro-animations** for premium feel
- **Consistent spacing** using an 8px grid system

---

## Color System

### Dark Theme (Default)
```css
--bg-primary:       #0f0f1a      /* Main background */
--bg-secondary:     #1a1a2e      /* Card/sidebar background */
--bg-elevated:      #252540      /* Elevated surfaces (dropdowns, modals) */
--bg-card:          #1e1e35      /* Card backgrounds */
--bg-hover:         #2a2a45      /* Hover state */
--bg-canvas:        #1a1a2e      /* Canvas background */

--text-primary:     #f0f0f5      /* Primary text */
--text-secondary:   #8b8ba3      /* Secondary/muted text */
--text-tertiary:    #5a5a7a      /* Tertiary/disabled text */

--border-primary:   #2a2a45      /* Default borders */
--border-secondary: #3a3a55      /* Emphasized borders */
--border-hover:     #4a4a65      /* Hovered borders */

--accent-primary:   #7c3aed      /* Primary accent (purple) */
--accent-secondary: #a855f7      /* Secondary accent */
--accent-gradient:  linear-gradient(135deg, #7c3aed, #a855f7)
--accent-subtle:    rgba(124, 58, 237, 0.1)
--accent-glow:      rgba(124, 58, 237, 0.25)

--glass-bg:         rgba(15, 15, 26, 0.8)  /* Glassmorphism */
```

### Light Theme
```css
--bg-primary:       #f8f9fc
--bg-secondary:     #ffffff
--bg-elevated:      #ffffff
--bg-card:          #ffffff
--bg-hover:         #f0f1f5
--bg-canvas:        #ffffff

--text-primary:     #1a1a2e
--text-secondary:   #64648a
--text-tertiary:    #9494b2

--border-primary:   #e2e4ea
--border-secondary: #d0d4dc
--border-hover:     #b0b4c4

--glass-bg:         rgba(248, 249, 252, 0.85)
```

### Status Colors
```css
--success:     #10b981    /* Green — active, online, success */
--warning:     #f59e0b    /* Amber — host role, warnings */
--danger:      #ef4444    /* Red — errors, destructive actions */
```

---

## Typography

### Font Family
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`

### Type Scale

| Element | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|
| Hero H1 | 2.5rem (40px) | 800 | -0.03em | Dashboard hero title |
| Page H1 | 1.5rem (24px) | 800 | -0.02em | Page titles |
| Card H3 | 1.125rem (18px) | 700 | — | Card titles, modal headers |
| Section H2 | 1.25rem (20px) | 700 | — | Section headings |
| Body | 0.9375rem (15px) | 400 | — | Default text |
| Small | 0.875rem (14px) | 400/600 | — | Secondary text, inputs |
| Tiny | 0.8125rem (13px) | 600 | — | Buttons, labels |
| Micro | 0.75rem (12px) | 700 | 0.06em | Uppercase labels |
| Badge | 0.6875rem (11px) | 600/700 | 0.05em | Tags, badges, tooltips |
| Caption | 0.625rem (10px) | 700 | — | Notification badges |

---

## Spacing Scale

Based on an **8px grid**:

| Token | Value | Usage |
|---|---|---|
| 2px | 2px | Dot indicators |
| 4px | 4px | Tight padding, gaps |
| 6px | 6px | Small element gaps |
| 8px | 8px | Compact padding |
| 10px | 10px | Input padding, small gaps |
| 12px | 12px | Card gaps, button padding |
| 16px | 16px | Standard padding |
| 20px | 20px | Section padding |
| 24px | 24px | Card padding |
| 32px | 32px | Dashboard page padding |
| 40px | 40px | Large section spacing |
| 48px | 48px | Hero sections |

---

## Border Radius

```css
--radius-sm:     8px     /* Buttons, small elements */
--radius-md:     12px    /* Cards, inputs, dropdowns */
--radius-lg:     16px    /* Large cards, modals */
--radius-xl:     20px    /* Full-size cards, panels */
--radius-full:   9999px  /* Pills, avatars, badges */
```

---

## Shadows & Elevation

| Level | Shadow Value | Usage |
|---|---|---|
| **sm** | `0 1px 3px rgba(0,0,0,0.2)` | Small elements, badges |
| **md** | `0 4px 12px rgba(0,0,0,0.15)` | Cards on hover |
| **lg** | `0 8px 32px rgba(0,0,0,0.2)` | Modals, dropdowns |
| **glow** | `0 4px 20px rgba(124,58,237,0.15)` | Accent hover effects |

---

## Component Patterns

### Buttons

| Class | Style | Usage |
|---|---|---|
| `.btn-primary` | Gradient purple, white text | Primary actions (Create, Sign in) |
| `.btn-secondary` | Subtle bg with accent border | Secondary actions (Join room) |
| `.btn-ghost` | Transparent, hover reveals bg | Tertiary actions (Logout) |
| `.btn-accent` | Purple gradient | Special actions (Open Whiteboard) |
| `.btn-icon` | 36×36px square, icon only | Toolbar tool buttons |
| `.btn-sm` | 36px height, compact | Small actions |
| `.btn-full` | 100% width | Full-width buttons |

### Inputs
```
Height:       44px
Padding:      0 16px (with icon: 0 16px 0 44px)
Background:   var(--bg-primary)
Border:       1px solid var(--border-primary)
Border-radius: var(--radius-md) [12px]
Focus:        border-color: var(--accent-primary), glow shadow
Placeholder:  var(--text-tertiary)
```

### Cards
```
Background:   var(--bg-card)
Border:       1px solid var(--border-primary)
Border-radius: var(--radius-lg) or var(--radius-xl)
Padding:      24px or 32px
Hover:        border-color change, translateY(-2px), box-shadow
Transition:   250ms ease
```

### Avatars
```
Size:         32px (nav), 36px (user list), 28px (chat)
Shape:        Circle (border-radius: 50%)
Background:   Gradient based on username initial
Font:         Bold, uppercase initials
Online dot:   10px bottom-right, green with bg border
```

### Modals
```
Overlay:      rgba(0,0,0,0.65) + backdrop-filter: blur(8px)
Animation:    scale(0.95) → scale(1) + fade-in
Border-radius: var(--radius-xl) [20px]
Max-width:    480px (share modal), 520px (image modal)
Shadow:       0 24px 80px rgba(0,0,0,0.5)
```

---

## Layout System

### Page Structure

#### Authentication Pages
```
┌───────────────────────────────────────┐
│              .auth-page               │
│  ┌─────────────────────────────────┐  │
│  │  .auth-container (max-420px)    │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │  .auth-card              │   │  │
│  │  │  ┌──────────────┐       │   │  │
│  │  │  │  Logo + Title │       │   │  │
│  │  │  └──────────────┘       │   │  │
│  │  │  ┌──────────────┐       │   │  │
│  │  │  │  Form Fields  │       │   │  │
│  │  │  └──────────────┘       │   │  │
│  │  │  ┌──────────────┐       │   │  │
│  │  │  │  Submit Btn   │       │   │  │
│  │  │  └──────────────┘       │   │  │
│  │  │  Footer Link             │   │  │
│  │  └──────────────────────────┘   │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

#### Dashboard
```
┌─────────────────────────────────────────┐
│  Navbar (64px, sticky, glassmorphism)   │
├─────────────────────────────────────────┤
│  .dashboard-content (max-1200px)        │
│  ┌───────────────────────────────────┐  │
│  │  Hero: "Your Creative Space"      │  │
│  └───────────────────────────────────┘  │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Create│ │ Join │ │Sketch│            │
│  │ Room │ │ Room │ │Board │            │
│  └──────┘ └──────┘ └──────┘            │
│  ┌───────────────────────────────────┐  │
│  │  "Your Rooms" grid               │  │
│  │  ┌────┐ ┌────┐ ┌────┐            │  │
│  │  │Room│ │Room│ │Room│            │  │
│  │  └────┘ └────┘ └────┘            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### Whiteboard Page
```
┌─────────────────────────────────────────────────┐
│  Toolbar (56px): Back | Tools | Theme | Share   │
├──────────────────────────────┬──────────────────┤
│                              │  Sidebar (320px)  │
│  Canvas (flex: 1)            │  ┌──────────────┐ │
│                              │  │ Chat | Users │ │
│  - Mouse/Touch drawing       │  ├──────────────┤ │
│  - Remote cursors            │  │              │ │
│                              │  │  Messages /  │ │
│                              │  │  User List   │ │
│                              │  │              │ │
│                              │  ├──────────────┤ │
│                              │  │  Chat input  │ │
│                              │  └──────────────┘ │
└──────────────────────────────┴──────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|---|---|---|
| **Desktop** | ≥1200px | Full layout, all features visible |
| **Small Desktop** | 900–1199px | Toolbar scrolls, sidebar narrower |
| **Tablet** | 600–899px | Toolbar scrolls, room info hidden |
| **Mobile** | <600px | Toolbar wraps, sidebar overlay, stacked actions |
| **Small Mobile** | <400px | Compact auth cards, minimal padding |

### Key Breakpoint CSS
```css
@media (max-width: 900px) {
  .toolbar-center { overflow-x: auto; max-width: 60vw; }
  .toolbar-room-info { display: none; }
}

@media (max-width: 768px) {
  .dashboard-actions { flex-direction: column; }
  .action-card { max-width: 100%; }
}

@media (max-width: 600px) {
  .whiteboard-toolbar { flex-wrap: wrap; height: auto; }
  .toolbar-center { order: 3; width: 100%; }
  .auth-container { padding: 16px; }
}
```

---

## Animation & Transitions

### Transition Tokens
```css
--transition:       all 250ms ease
--transition-fast:  all 150ms ease
```

### Keyframe Animations

| Animation | Duration | Usage |
|---|---|---|
| `fadeIn` | 200ms | Modal overlay |
| `modalSlideIn` | 300ms | Modal entrance |
| `messageIn` | 300ms | Chat messages |
| `slideUp` | 300ms | Toast notifications |
| `pulse` | 2s (infinite) | Online status dots |
| `spin` | 1s (infinite) | Loading spinner |
| `shimmer` | 2s (infinite) | Loading placeholder shimmer |

### Hover Micro-animations
```css
/* Card lift */
transform: translateY(-2px);
box-shadow: var(--shadow-md);

/* Button scale */
transform: scale(1.02);

/* Color swatch zoom */
transform: scale(1.15);
```

---

## Wireframe Specifications

### Screen 1: Login / Register
- Centered card (max-width: 420px)
- Logo icon (48×48px gradient) + App name
- Form fields with left-aligned icons
- Primary CTA button (full-width)
- Footer link to alternate auth page
- Animated gradient background orb

### Screen 2: Dashboard
- Sticky top navbar with glassmorphism
- Brand logo + user avatar in nav
- Hero section with gradient text
- Three action cards side-by-side (Create, Join, Sketch)
- Room grid below with status indicators
- Each room card: name, room ID badge, members count, timestamp, status dot

### Screen 3: Whiteboard Room
- Full-height layout (100vh, no scroll)
- Top toolbar with three sections (left/center/right)
- Center toolbar: pill-shaped with tool icons
- Canvas fills remaining space
- Right sidebar: tabbed (Chat/Users), 320px width
- Chat: messages with avatars, input at bottom
- Users: list with role badges and online dots

### Screen 4: Simple Whiteboard
- Same toolbar layout as room (without sidebar)
- Extra tools: Text, Rectangle, Circle, Line
- Share image modal with PNG preview
- "Personal" badge in toolbar
- No Socket.io connection needed

### Screen 5: Share Modal
- Overlay with backdrop blur
- Header: gradient icon + title + subtitle
- Room ID field (monospace, large) with copy button
- Invite link field with copy button
- Social share buttons: WhatsApp, Email, Telegram, More

### Screen 6: Mobile Responsive Demo
- Left sidebar navigation (collapsible on mobile)
- Section-based content with live previews
- Device size switcher (Phone/Tablet/Desktop)
- Code info blocks with implementation details
- Feature cards grid with gradient icons

---

## Accessibility

### Keyboard Navigation
- All interactive elements are focusable
- Tab order follows visual order
- Buttons and links have hover/focus states
- Modal closes on Escape key
- Enter/Space activates buttons

### Screen Reader Support
- Semantic HTML5 elements (`<nav>`, `<main>`, `<aside>`)
- Descriptive `title` attributes on icon buttons
- ARIA labels where needed
- Proper heading hierarchy (single H1 per page)

### Color Contrast
- Text colors meet WCAG AA standards
- Interactive elements have clear visual feedback
- Status indicators don't rely solely on color (dot + text)

### Motion
- Animations use `prefers-reduced-motion` consideration
- Transitions are short (150–300ms)
- No auto-playing animations that distract

---

## File Structure Reference

```
client/src/
├── index.css                    ← Design system tokens + all component styles
├── contexts/
│   ├── AuthContext.jsx          ← JWT auth state
│   └── ThemeContext.jsx         ← Dark/Light mode with CSS class toggling
├── components/
│   ├── auth/ProtectedRoute.jsx  ← Route guard
│   ├── chat/ChatPanel.jsx       ← In-room chat
│   ├── room/UsersPanel.jsx      ← Online user list
│   └── ui/ShareModal.jsx        ← Room share modal
├── pages/
│   ├── Login.jsx                ← Auth screen
│   ├── Register.jsx             ← Auth screen
│   ├── Dashboard.jsx            ← Room management hub
│   ├── WhiteboardPage.jsx       ← Collaborative whiteboard
│   ├── SimpleWhiteboard.jsx     ← Personal practice whiteboard
│   └── MobileResponsiveDemo.jsx ← Responsive patterns showcase
└── utils/
    ├── api.js                   ← Axios instance
    └── socket.js                ← Socket.io client
```

---

**Built with ❤️ using the MERN Stack**
