import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Palette, ArrowLeft, Send } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            toast.success(response.data.message || 'Reset link sent to your email! 📧');
            setSent(true);
        } catch (error) {
            console.error('Forgot password error:', error);
            const msg = error.response?.data?.message || 'Failed to send reset email. Please try again.';
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
                        <p>Password Recovery</p>
                    </div>

                    {!sent ? (
                        <>
                            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="form-input-wrapper">
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-input"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <Mail />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending link...' : 'Send Reset Link'}
                                    {!loading && <Send size={16} style={{ marginLeft: '8px' }} />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="auth-success-state" style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Check your email</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <button
                                className="btn btn-outline btn-full"
                                onClick={() => setSent(false)}
                            >
                                Didn&apos;t receive it? Try again
                            </button>
                        </div>
                    )}

                    <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
