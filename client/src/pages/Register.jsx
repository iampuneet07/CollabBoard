import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password);
            toast.success('Account created! Welcome aboard! 🎉');
            navigate('/dashboard');
        } catch (error) {
            console.error('Registration error:', error);
            const msg = error.response?.data?.message ||
                (error.response?.data?.errors ? error.response.data.errors[0].msg : null) ||
                'Registration failed. Please check your connection.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Palette />
                        </div>
                        <h1>CollabBoard</h1>
                        <p>Create your creative workspace</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <div className="form-input-wrapper">
                                <input
                                    id="username"
                                    type="text"
                                    className="form-input"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                />
                                <User />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="form-input-wrapper">
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                                <Mail />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="form-input-wrapper">
                                <input
                                    id="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <Lock />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="form-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="form-input"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <Lock />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
