# 🎨 CollabBoard — Real-Time Collaborative Whiteboard

A full-stack real-time collaborative whiteboard application built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). Multiple users can join shared rooms and draw simultaneously with real-time synchronization using **Socket.io**.

![CollabBoard](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** — JWT-based Register / Login / Logout
- 🏠 **Room Management** — Create and join whiteboard rooms via unique Room ID
- 🎨 **Real-time Drawing** — Synchronized canvas drawing using Socket.io
- 🖊️ **Drawing Tools** — Pencil, Eraser, Clear Board
- 🎨 **Color Picker** — 18 preset colors + custom color picker
- 📏 **Brush Size** — Adjustable brush thickness
- 👥 **Multi-user Collaboration** — Room-based real-time collaboration
- 💬 **Chat System** — In-room messaging with real-time updates
- 💾 **Persistent Storage** — Whiteboard sessions saved in MongoDB
- ⚛️ **React Hooks** — Built with useState, useEffect, useRef, useCallback

### Intermediate Features
- ↩️ **Undo / Redo** — Canvas history management
- 📸 **Save as Image** — Export whiteboard as PNG
- 🟢 **User Presence** — See who's online in the room
- 🔒 **Protected Routes** — Frontend route guarding
- 👑 **Role-based Permissions** — Host / Participant roles
- ⚠️ **Error Handling** — Comprehensive validation

### Advanced Features
- 🌗 **Dark/Light Mode** — Toggle between themes
- 🖱️ **Cursor Tracking** — See other users' cursors in real-time
- 📋 **Copy Room ID** — One-click copy for easy sharing
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **React.js** | Frontend UI |
| **Vite** | Build Tool & Dev Server |
| **Node.js** | Runtime Environment |
| **Express.js** | Backend Framework |
| **MongoDB** | Database |
| **Mongoose** | MongoDB ODM |
| **Socket.io** | WebSocket Communication |
| **JWT** | Authentication |
| **bcryptjs** | Password Hashing |
| **Lucide React** | Icons |

---

## 📁 Project Structure

```
CollabBoard/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # ProtectedRoute
│   │   │   ├── chat/          # ChatPanel
│   │   │   ├── room/          # UsersPanel
│   │   │   └── ui/            # Shared UI components
│   │   ├── contexts/          # AuthContext, ThemeContext
│   │   ├── pages/             # Login, Register, Dashboard, WhiteboardPage
│   │   ├── utils/             # API client, Socket client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                    # Express Backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Route handlers (MVC)
│   ├── middleware/             # JWT auth middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── utils/                 # Socket.io setup
│   ├── server.js              # Entry point
│   ├── .env                   # Environment variables
│   └── package.json
├── .gitignore
├── package.json               # Root scripts
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v16+ installed
- **MongoDB** running locally or MongoDB Atlas URI
- **Git** installed

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd CollabBoard
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabboard
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Start the Application

**Terminal 1 — Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Start Frontend:**
```bash
cd client
npm run dev
```

### 5. Open in Browser
Navigate to `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/join` | Join room |
| GET | `/api/rooms` | Get user's rooms |
| GET | `/api/rooms/:roomId` | Get room details |
| PUT | `/api/rooms/:roomId/close` | Close room (host only) |

### Whiteboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/whiteboard/:roomId` | Get whiteboard data |
| POST | `/api/whiteboard/:roomId/snapshot` | Save snapshot |
| DELETE | `/api/whiteboard/:roomId` | Clear whiteboard |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:roomId` | Get room messages |

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a room |
| `leave-room` | Client → Server | Leave a room |
| `draw-start` | Bidirectional | Start drawing stroke |
| `draw-move` | Bidirectional | Continue drawing |
| `draw-end` | Bidirectional | End drawing stroke |
| `clear-board` | Bidirectional | Clear whiteboard |
| `send-message` | Client → Server | Send chat message |
| `new-message` | Server → Client | New chat message |
| `users-updated` | Server → Client | Online users list |
| `cursor-move` | Bidirectional | Cursor position |

---

## 🎨 UI Features

- **Glassmorphism** design with blur effects
- **Dark/Light mode** with smooth transitions
- **Animated gradients** and micro-interactions
- **Responsive layout** for all screen sizes
- **Premium typography** using Inter font
- **Custom scrollbars** and form styling

---

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ using MERN Stack + Socket.io**
