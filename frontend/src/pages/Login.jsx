import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
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

    const handleGoogle = async () => {
        setError('')
        try {
            await signInWithGoogle()
        } catch (err) {
            setError(err.message || 'Google sign in failed')
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

                {/* Google */}
                <button className="login-google-btn" onClick={handleGoogle} type="button">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                        <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.044l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="login-divider">
                    <span>or</span>
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
