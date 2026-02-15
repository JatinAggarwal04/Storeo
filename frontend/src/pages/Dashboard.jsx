import { useState, useEffect } from 'react'
import {
    getDashboardStats,
    getOrders,
    updateOrderStatus,
    getWhatsAppStatus,
    testWhatsAppMessage,
} from '../services/api'

const STATUS_BADGES = {
    pending: 'badge-amber',
    confirmed: 'badge-sky',
    preparing: 'badge-purple',
    delivered: 'badge-green',
    cancelled: 'badge-rose',
}

export default function Dashboard({ business }) {
    const [stats, setStats] = useState(null)
    const [orders, setOrders] = useState([])
    const [botStatus, setBotStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [testMsg, setTestMsg] = useState('')
    const [testReply, setTestReply] = useState('')
    const [testing, setTesting] = useState(false)

    useEffect(() => {
        if (business?.id) {
            fetchAll()
        } else {
            setLoading(false)
        }
    }, [business?.id])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [statsData, ordersData, statusData] = await Promise.all([
                getDashboardStats(business.id).catch(() => null),
                getOrders(business.id).catch(() => ({ orders: [] })),
                getWhatsAppStatus(business.id).catch(() => null),
            ])
            setStats(statsData)
            setOrders(ordersData.orders || [])
            setBotStatus(statusData)
        } catch (err) {
            console.error('Dashboard fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus)
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
            )
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const handleTestMessage = async () => {
        if (!testMsg.trim() || testing || !business?.id) return
        setTesting(true)
        setTestReply('')
        try {
            const result = await testWhatsAppMessage(business.id, testMsg)
            setTestReply(result.reply)
        } catch (err) {
            setTestReply('Error: Make sure the backend is running and API keys are configured.')
        } finally {
            setTesting(false)
        }
    }

    if (!business) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No Business Selected</h3>
                    <p>Set up your business first to see your dashboard and bot status.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="page">
                <div className="page-loading">
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                    <span>Loading dashboard...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview for {business.name}</p>
            </div>

            {/* Bot Status */}
            <div className="bot-status-card">
                <div className={`bot-status-indicator ${botStatus?.active ? 'active' : 'inactive'}`}>
                    {botStatus?.active ? '🤖' : '⏸️'}
                </div>
                <div className="bot-status-info">
                    <h3>WhatsApp Bot — {botStatus?.active ? 'Active' : 'Setup Pending'}</h3>
                    <p>
                        {botStatus?.whatsapp_configured
                            ? `Connected: ${botStatus.whatsapp_number}`
                            : 'Configure your Twilio WhatsApp webhook to activate the bot. See the setup guide below.'}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>📦</div>
                    <div className="stat-value">{stats?.total_orders ?? 0}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>👥</div>
                    <div className="stat-value">{stats?.total_customers ?? 0}</div>
                    <div className="stat-label">Customers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>💬</div>
                    <div className="stat-value">{stats?.total_conversations ?? 0}</div>
                    <div className="stat-label">Conversations</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>💰</div>
                    <div className="stat-value">₹{(stats?.total_revenue ?? 0).toLocaleString('en-IN')}</div>
                    <div className="stat-label">Revenue</div>
                </div>
            </div>

            {/* Two Column: Test Bot + Recent Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Test Bot Card */}
                <div className="card">
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '16px' }}>
                        🧪 Test Your Bot
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Send a test message to see how your bot responds. No WhatsApp connection needed.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="e.g. Do you have steel plates?"
                            value={testMsg}
                            onChange={(e) => setTestMsg(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTestMessage()}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleTestMessage}
                            disabled={testing || !testMsg.trim()}
                        >
                            {testing ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : 'Send'}
                        </button>
                    </div>
                    {testReply && (
                        <div style={{
                            padding: '14px 16px',
                            background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                        }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                                🤖 Bot Response:
                            </div>
                            {testReply}
                        </div>
                    )}
                </div>

                {/* WhatsApp Status Card */}
                <div className="card">
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '16px' }}>
                        📱 WhatsApp Activation
                    </h3>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '12px' }}>
                            Your bot is currently <strong>{botStatus?.active ? 'Active ✅' : 'Pending Activation ⏳'}</strong>.
                        </p>
                        {!botStatus?.active && (
                            <p>
                                We are setting up your WhatsApp Business account. This usually takes 24-48 hours.
                                We will notify you on <strong>{business.phone_number || business.whatsapp_number}</strong> once it's ready.
                            </p>
                        )}
                        {botStatus?.active && (
                            <p>
                                Your bot is live! Share your number <strong>{botStatus?.whatsapp_number}</strong> with customers to start taking orders.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '16px' }}>
                    Recent Orders
                </h3>

                {orders.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 24px' }}>
                        <div className="empty-icon">🛒</div>
                        <h3>No Orders Yet</h3>
                        <p>Orders from WhatsApp customers will appear here.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {order.customer_name || '—'}
                                        </td>
                                        <td>{order.customer_phone}</td>
                                        <td>
                                            {Array.isArray(order.items) ? (
                                                order.items.map((item, i) => (
                                                    <div key={i} style={{ fontSize: 'var(--text-xs)' }}>
                                                        {item.product} × {item.quantity}
                                                    </div>
                                                ))
                                            ) : '—'}
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                            ₹{parseFloat(order.total || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td>
                                            <select
                                                className="status-select"
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>
                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
