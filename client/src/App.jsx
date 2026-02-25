import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WhiteboardPage from './pages/WhiteboardPage';
import SimpleWhiteboard from './pages/SimpleWhiteboard';
import MobileResponsiveDemo from './pages/MobileResponsiveDemo';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/whiteboard/:roomId"
                            element={
                                <ProtectedRoute>
                                    <WhiteboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/sketch"
                            element={
                                <ProtectedRoute>
                                    <SimpleWhiteboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/mobile-demo"
                            element={
                                <ProtectedRoute>
                                    <MobileResponsiveDemo />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-secondary)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '0.875rem',
                        },
                    }}
                />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
