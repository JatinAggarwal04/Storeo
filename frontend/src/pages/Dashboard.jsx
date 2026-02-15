import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
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
    const { t } = useLanguage()
    const isDemo = business?.is_demo || false
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
                <div>
                    <h2>{t('dashboardTitle')}</h2>
                    <p>{t('dashboardSubtitle')} {isDemo ? 'Demo Business' : business?.name}</p>
                </div>
                {/* Status Indicator */}
                <div className={`status-badge ${botStatus === 'active' ? 'status-active' : 'status-pending'}`}>
                    <span className="status-dot"></span>
                    {botStatus === 'active' ? t('botActive') : t('botPending')}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">📊</div>
                    <div className="stat-info">
                        <h3>{stats?.total_orders || 0}</h3>
                        <p>{t('totalOrders') || 'Total Orders'}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">💰</div>
                    <div className="stat-info">
                        <h3>₹{stats?.total_revenue?.toLocaleString() || 0}</h3>
                        <p>{t('totalRevenue') || 'Total Revenue'}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">📅</div>
                    <div className="stat-info">
                        <h3>{stats?.today_orders || 0}</h3>
                        <p>{t('todayOrders') || 'Today\'s Orders'}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">💬</div>
                    <div className="stat-info">
                        <h3>{stats?.total_conversations || 0}</h3>
                        <p>{t('customerInteractions') || 'Interactions'}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* WhatsApp Status Card */}
                <div className="card">
                    <div className="card-header">
                        <h3>{t('whatsappActivation')}</h3>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '10px' }}>
                            {botStatus === 'active'
                                ? t('botLiveMessage')
                                : <span>
                                    {t('botSetupMessage')} <strong>{business?.whatsapp_number}</strong>.
                                </span>
                            }
                        </p>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="card">
                    <div className="card-header">
                        <h3>{t('recentOrders')}</h3>

                        {loading ? (
                            <div className="loading-state">{t('loading')}</div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🛍️</div>
                                <h4>{t('noOrders')}</h4>
                                <p>{t('ordersEmptyMsg')}</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>{t('orderCustomer')}</th>
                                            <th>{t('orderItems')}</th>
                                            <th>{t('orderTotal')}</th>
                                            <th>{t('orderStatus')}</th>
                                            <th>{t('orderDate')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id}>
                                                <td>#{order.id}</td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{order.customer}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.phone}</div>
                                                </td>
                                                <td>{order.items}</td>
                                                <td>₹{order.total}</td>
                                                <td>
                                                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{order.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
