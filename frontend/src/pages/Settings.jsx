import { useState, useEffect } from 'react'
import { updateBusiness } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

const TONE_OPTIONS = [
    { value: 'friendly', label: 'Friendly', emoji: '😊', desc: 'Warm and conversational' },
    { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Formal and polished' },
    { value: 'casual', label: 'Casual', emoji: '✌️', desc: 'Relaxed and informal' },
]

export default function Settings({ business }) {
    const { t } = useLanguage()
    const [form, setForm] = useState({
        greeting_message: '',
        bot_tone: 'Friendly',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [newFeature, setNewFeature] = useState('')

    useEffect(() => {
        if (user?.id && business?.id) {
            fetchPrefs()
        } else {
            setLoading(false)
        }
    }, [user?.id, business?.id])

    const fetchPrefs = async () => {
        setLoading(true)
        try {
            const data = await loadPreferences(user.id, business.id)
            if (data) {
                setPrefs({
                    bot_tone: data.bot_tone || 'friendly',
                    auto_greet: data.auto_greet ?? true,
                    greeting_message: data.greeting_message || '',
                    business_hours: data.business_hours || { open: '09:00', close: '21:00' },
                    feature_requests: data.feature_requests || [],
                })
            }
        } catch (err) {
            console.error('Failed to load preferences:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!user?.id || !business?.id) return
        setSaving(true)
        setSaved(false)
        try {
            await savePreferences(user.id, business.id, prefs)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            console.error('Failed to save preferences:', err)
        } finally {
            setSaving(false)
        }
    }

    const addFeature = () => {
        const text = newFeature.trim()
        if (!text) return
        setPrefs(prev => ({
            ...prev,
            feature_requests: [...prev.feature_requests, text],
        }))
        setNewFeature('')
    }

    const removeFeature = (i) => {
        setPrefs(prev => ({
            ...prev,
            feature_requests: prev.feature_requests.filter((_, idx) => idx !== i),
        }))
    }

    if (!business) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                            <circle cx="24" cy="24" r="8" />
                            <path d="M24 4v6M24 38v6M7.03 7.03l4.24 4.24M36.73 36.73l4.24 4.24M4 24h6M38 24h6M7.03 40.97l4.24-4.24M36.73 11.27l4.24-4.24" />
                        </svg>
                    </div>
                    <h3>No Business Selected</h3>
                    <p>Set up a business first to configure your bot preferences.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="page">
                <div className="page-loading">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <span>Loading settings...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header settings-header">
                <div>
                    <h2>Settings</h2>
                    <p>Configure your WhatsApp bot for {business.name}</p>
                </div>
                <button
                    className={`btn btn-primary${saved ? ' btn-saved' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
                    ) : saved ? (
                        '✓ Saved'
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            <div className="settings-grid">
                {/* Bot Tone */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 9.5c0 2.5-2 4.5-4.5 4.5S5.5 12 5.5 9.5" />
                            <path d="M10 14v3.5M7 17.5h6" />
                            <rect x="7" y="3" width="6" height="7" rx="3" />
                        </svg>
                        <h3>Bot Tone</h3>
                    </div>
                    <p className="settings-card-desc">Choose how your bot communicates with customers</p>
                    <div className="tone-options">
                        {TONE_OPTIONS.map(opt => (
                            <label
                                key={opt.value}
                                className={`tone-option${prefs.bot_tone === opt.value ? ' active' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="tone"
                                    value={opt.value}
                                    checked={prefs.bot_tone === opt.value}
                                    onChange={() => setPrefs(prev => ({ ...prev, bot_tone: opt.value }))}
                                />
                                <span className="tone-emoji">{opt.emoji}</span>
                                <span className="tone-label">{opt.label}</span>
                                <span className="tone-desc">{opt.desc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Greeting */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 14.5c0-2.5 3-4 7-4s7 1.5 7 4" />
                            <circle cx="10" cy="6" r="3.5" />
                        </svg>
                        <h3>Greeting</h3>
                    </div>
                    <p className="settings-card-desc">The first message customers see when they message you</p>
                    <label className="toggle-row">
                        <span>Auto-greet new customers</span>
                        <div className={`toggle${prefs.auto_greet ? ' on' : ''}`} onClick={() => setPrefs(prev => ({ ...prev, auto_greet: !prev.auto_greet }))}>
                            <div className="toggle-thumb" />
                        </div>
                    </label>
                    {prefs.auto_greet && (
                        <textarea
                            className="settings-textarea"
                            placeholder="e.g. Hi! 👋 Welcome to our store. How can we help you today?"
                            value={prefs.greeting_message}
                            onChange={(e) => setPrefs(prev => ({ ...prev, greeting_message: e.target.value }))}
                            rows={3}
                        />
                    )}
                </div>

                {/* Business Hours */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="10" cy="10" r="8" />
                            <polyline points="10,5 10,10 14,12" />
                        </svg>
                        <h3>Business Hours</h3>
                    </div>
                    <p className="settings-card-desc">Bot will inform customers outside these hours</p>
                    <div className="hours-row">
                        <div className="hours-field">
                            <label>Opens</label>
                            <input
                                type="time"
                                className="settings-time-input"
                                value={prefs.business_hours.open}
                                onChange={(e) => setPrefs(prev => ({ ...prev, business_hours: { ...prev.business_hours, open: e.target.value } }))}
                            />
                        </div>
                        <span className="hours-sep">—</span>
                        <div className="hours-field">
                            <label>Closes</label>
                            <input
                                type="time"
                                className="settings-time-input"
                                value={prefs.business_hours.close}
                                onChange={(e) => setPrefs(prev => ({ ...prev, business_hours: { ...prev.business_hours, close: e.target.value } }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Feature Wishlist */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.5L10 14.5l-4.8 2.5.9-5.5L2.2 7.7l5.4-.8L10 2z" />
                        </svg>
                        <h3>Feature Wishlist</h3>
                    </div>
                    <p className="settings-card-desc">What features or capabilities would you like?</p>
                    <div className="feature-input-row">
                        <input
                            className="settings-input"
                            placeholder="e.g. Payment integration, Analytics..."
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                        />
                        <button className="btn btn-secondary btn-sm" onClick={addFeature}>Add</button>
                    </div>
                    {prefs.feature_requests.length > 0 && (
                        <div className="feature-tags">
                            {prefs.feature_requests.map((f, i) => (
                                <div key={i} className="feature-tag">
                                    {f}
                                    <button onClick={() => removeFeature(i)}>×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
