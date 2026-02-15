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
                        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 24, boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)' }}>
                            S
                        </div>
                    </div>
                    <h1 style={{ marginTop: '16px', marginBottom: '8px' }}>Stoereo</h1>
                    <p>WhatsApp Business Automation</p>
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
