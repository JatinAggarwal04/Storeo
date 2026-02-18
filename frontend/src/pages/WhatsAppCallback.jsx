import { useEffect, useState } from 'react'
import { connectWhatsApp } from '../services/api'

export default function WhatsAppCallback() {
    const [status, setStatus] = useState('Connecting your WhatsApp Business account...')
    const [error, setError] = useState('')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const businessId = params.get('state')  // we pass businessId as state param

        if (!code || !businessId) {
            setError('Missing authorization code or business ID.')
            return
        }

        connectWhatsApp(businessId, code)
            .then(() => {
                setStatus('WhatsApp connected successfully! Closing...')
                // Notify opener window
                if (window.opener) {
                    window.opener.postMessage({ type: 'WHATSAPP_CONNECTED' }, window.location.origin)
                    setTimeout(() => window.close(), 1000)
                } else {
                    // Redirect flow fallback
                    window.location.href = '/'
                }
            })
            .catch((err) => {
                setError(err.message || 'Failed to connect WhatsApp. Please try again.')
            })
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
        }}>
            {error ? (
                <>
                    <div style={{ fontSize: '2rem' }}>❌</div>
                    <h2>Connection Failed</h2>
                    <p style={{ color: '#666' }}>{error}</p>
                    <button onClick={() => window.close()} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        Close
                    </button>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '2rem' }}>⏳</div>
                    <h2>{status}</h2>
                </>
            )}
        </div>
    )
}
