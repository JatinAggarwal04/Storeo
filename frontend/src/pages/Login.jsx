import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const { signInWithEmail, signUpWithEmail } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password)
                setSuccess('Check your email for a confirmation link!')
                setEmail('')
                setPassword('')
            } else {
                await signInWithEmail(email, password)
            }
        } catch (err) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb login-bg-orb-1" />
                <div className="login-bg-orb login-bg-orb-2" />
                <div className="login-bg-orb login-bg-orb-3" />
            </div>

            <div className="login-card">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="12" fill="url(#logo-grad)" />
                            <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.5 0-2.9-.4-4.1-1.1L12 28l1.1-3.9C12.4 22.9 12 21.5 12 20z" fill="white" fillOpacity="0.9" />
                            <circle cx="17" cy="19" r="1.2" fill="url(#logo-grad)" />
                            <circle cx="20" cy="19" r="1.2" fill="url(#logo-grad)" />
                            <circle cx="23" cy="19" r="1.2" fill="url(#logo-grad)" />
                            <defs>
                                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#25D366" />
                                    <stop offset="1" stopColor="#128C7E" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h1>BotBuilder</h1>
                    <p>WhatsApp bots for Indian businesses</p>
                </div>

                {/* Email form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-input-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="login-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="login-input-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            className="login-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}
                    {success && <div className="login-success">{success}</div>}

                    <button className="login-submit-btn" type="submit" disabled={loading}>
                        {loading ? (
                            <span className="spinner" style={{ width: 16, height: 16 }} />
                        ) : isSignUp ? (
                            'Create Account'
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-toggle">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError('')
                            setSuccess('')
                        }}
                    >
                        {isSignUp ? 'Sign in' : 'Sign up'}
                    </button>
                </div>
            </div>
        </div>
    )
}
