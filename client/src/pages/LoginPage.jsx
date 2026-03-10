import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Donor' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                const data = await register(form);
                navigate(data.user.role === 'Donor' ? '/donor' : '/receiver');
            } else {
                const data = await login(form.email, form.password);
                navigate(data.user.role === 'Donor' ? '/donor' : '/receiver');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>🌱 Food<span>Bridge</span></h1>
                <p className="auth-subtitle">
                    {isRegister ? 'Create an account to start saving food' : 'Welcome back! Sign in to continue'}
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                className="form-input"
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label>Role</label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-btn ${form.role === 'Donor' ? 'selected-donor' : ''}`}
                                    onClick={() => setForm({ ...form, role: 'Donor' })}
                                    id="role-donor"
                                >
                                    🤲 Donor
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${form.role === 'Receiver' ? 'selected-receiver' : ''}`}
                                    onClick={() => setForm({ ...form, role: 'Receiver' })}
                                    id="role-receiver"
                                >
                                    🙋 Receiver
                                </button>
                            </div>
                        </div>
                    )}

                    <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} id="auth-submit">
                        {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(''); }} id="toggle-auth">
                        {isRegister ? 'Sign In' : 'Register'}
                    </a>
                </p>
            </div>
        </div>
    );
}
