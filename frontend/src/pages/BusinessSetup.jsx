import { useState, useRef, useEffect } from 'react'
import { chatWithAI, createBusiness } from '../services/api'
import { saveChat, loadActiveChat } from '../lib/supabase'

const INITIAL_MESSAGE = {
    role: 'assistant',
    content: "Hey there! 👋 Welcome to BotBuilder — I'll help you set up a WhatsApp bot for your business in just a few minutes.\n\nTo get started, what kind of business do you run?",
}

export default function BusinessSetup({ onBusinessCreated, user }) {
    const [messages, setMessages] = useState([INITIAL_MESSAGE])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [businessData, setBusinessData] = useState(null)
    const [setupComplete, setSetupComplete] = useState(false)
    const [saving, setSaving] = useState(false)
    const [restoredChat, setRestoredChat] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Restore chat on mount
    useEffect(() => {
        if (user?.id && !restoredChat) {
            restoreChat()
        }
    }, [user?.id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    useEffect(() => {
        inputRef.current?.focus()
    }, [loading])

    const restoreChat = async () => {
        try {
            const chat = await loadActiveChat(user.id)
            if (chat?.messages?.length > 1) {
                setMessages(chat.messages)
                setRestoredChat(true)
            }
        } catch (err) {
            console.log('No previous chat to restore')
        }
        setRestoredChat(true)
    }

    const persistChat = async (msgs, businessId = null) => {
        if (!user?.id) return
        try {
            await saveChat(user.id, msgs, businessId)
        } catch (err) {
            console.log('Chat save skipped:', err.message)
        }
    }

    const handleSend = async () => {
        const text = input.trim()
        if (!text || loading) return

        const userMsg = { role: 'user', content: text }
        const updatedMessages = [...messages, userMsg]
        setMessages(updatedMessages)
        setInput('')
        setLoading(true)

        try {
            const response = await chatWithAI(updatedMessages)
            const assistantMsg = { role: 'assistant', content: response.reply }
            const finalMessages = [...updatedMessages, assistantMsg]
            setMessages(finalMessages)
            persistChat(finalMessages)

            if (response.complete && response.business_data) {
                setBusinessData(response.business_data)
            }
        } catch (err) {
            const errorMsg = {
                role: 'assistant',
                content: "Oops, I couldn't process that. Please make sure the backend server is running and your API keys are configured. Try again! 🙏",
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSaveBusiness = async () => {
        if (!businessData || saving) return
        setSaving(true)
        try {
            const payload = { ...businessData }
            if (user?.id) payload.user_id = user.id
            const result = await createBusiness(payload)
            if (result.business) {
                setSetupComplete(true)
                onBusinessCreated(result.business)
                const doneMessages = [
                    ...messages,
                    {
                        role: 'assistant',
                        content: `🎉 Your business "${result.business.name}" has been set up! Head over to **Inventory** to add your products, and then check your **Dashboard** to see your bot in action.`,
                    },
                ]
                setMessages(doneMessages)
                persistChat(doneMessages, result.business.id)
            }
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Something went wrong saving your business. Make sure Supabase is configured and try again.',
                },
            ])
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setMessages([INITIAL_MESSAGE])
        setBusinessData(null)
        setSetupComplete(false)
        setInput('')
        persistChat([INITIAL_MESSAGE])
    }

    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />')
    }

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2>Business Setup</h2>
                    <p>Chat with our AI to set up your WhatsApp bot</p>
                </div>
                {(messages.length > 1) && (
                    <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                        ↻ Start Over
                    </button>
                )}
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                            <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                        </div>
                    ))}

                    {loading && (
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    )}

                    {businessData && !setupComplete && (
                        <div style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                            <div className="card" style={{ maxWidth: '400px' }}>
                                <h4 style={{ marginBottom: '12px', fontSize: 'var(--text-base)', fontWeight: 600 }}>
                                    📋 Business Profile
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    <div><strong>Name:</strong> {businessData.business_name}</div>
                                    <div><strong>Type:</strong> {businessData.business_type}</div>
                                    <div><strong>Location:</strong> {businessData.location}</div>
                                    <div><strong>Description:</strong> {businessData.description}</div>
                                    <div><strong>Languages:</strong> {(businessData.languages || []).join(', ')}</div>
                                    <div><strong>WhatsApp Business:</strong> {businessData.has_whatsapp_business ? '✅ Yes' : '❌ Not yet'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-primary" onClick={handleSaveBusiness} disabled={saving}>
                                        {saving ? (
                                            <><span className="spinner" style={{ width: 16, height: 16 }}></span> Saving...</>
                                        ) : (
                                            '✅ Save & Create Bot'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {setupComplete && (
                        <div style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                            <div className="card" style={{
                                maxWidth: '420px',
                                background: 'var(--accent-soft)',
                                borderColor: 'var(--border-accent)',
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎉</div>
                                <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '8px' }}>You're all set!</h4>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    Your business profile is saved. Next steps:
                                </p>
                                <ol style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <li>Go to <strong>Inventory</strong> and add your products</li>
                                    <li>Check the <strong>Dashboard</strong> for your bot status</li>
                                    <li>Share your WhatsApp number with customers!</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {!setupComplete && (
                    <div className="chat-input-area">
                        <input
                            ref={inputRef}
                            className="input"
                            type="text"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : 'Send'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
