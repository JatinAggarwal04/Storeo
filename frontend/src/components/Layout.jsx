import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function Layout({ children, businesses, activeBusiness, onBusinessChange, user }) {
    const { signOut } = useAuth()
    const { t } = useLanguage()

    const NAV_ITEMS = [
        {
            path: '/',
            label: t('navBusinessSetup'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.5 2.5L17.5 6.5L8.5 15.5L3 17L4.5 11.5L13.5 2.5Z" />
                    <path d="M11.5 4.5L15.5 8.5" />
                </svg>
            ),
        },
        {
            path: '/inventory',
            label: t('navInventory'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 5L10 1.5L17.5 5L10 8.5L2.5 5Z" />
                    <path d="M2.5 5V14L10 17.5" />
                    <path d="M17.5 5V14L10 17.5" />
                    <path d="M10 8.5V17.5" />
                </svg>
            ),
        },
        {
            path: '/dashboard',
            label: t('navDashboard'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="10" width="4" height="8" rx="1" />
                    <rect x="8" y="6" width="4" height="12" rx="1" />
                    <rect x="14" y="2" width="4" height="16" rx="1" />
                </svg>
            ),
        },
        {
            path: '/settings',
            label: t('navSettings'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="10" r="3" />
                    <path d="M10 1.5V4" />
                    <path d="M10 16V18.5" />
                    <path d="M3.99 3.99L5.76 5.76" />
                    <path d="M14.24 14.24L16.01 16.01" />
                    <path d="M1.5 10H4" />
                    <path d="M16 10H18.5" />
                    <path d="M3.99 16.01L5.76 14.24" />
                    <path d="M14.24 5.76L16.01 3.99" />
                </svg>
            ),
        },
    ]

    const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
    const userEmail = user?.email || ''

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="12" fill="url(#sb-grad)" />
                            <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.5 0-2.9-.4-4.1-1.1L12 28l1.1-3.9C12.4 22.9 12 21.5 12 20z" fill="white" fillOpacity="0.9" />
                            <circle cx="17" cy="19" r="1.2" fill="url(#sb-grad)" />
                            <circle cx="20" cy="19" r="1.2" fill="url(#sb-grad)" />
                            <circle cx="23" cy="19" r="1.2" fill="url(#sb-grad)" />
                            <defs>
                                <linearGradient id="sb-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#25D366" />
                                    <stop offset="1" stopColor="#128C7E" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="sidebar-header">
                            <h1>Stoereo</h1>
                        </div>
                        <span>WhatsApp for Business</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link${isActive ? ' active' : ''}`
                            }
                            end={item.path === '/'}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {businesses.length > 0 && (
                    <div className="sidebar-business-section">
                        <label className="sidebar-section-label">{t('activeBusiness')}</label>
                        <select
                            className="sidebar-business-select"
                            value={activeBusiness?.id || ''}
                            onChange={(e) => onBusinessChange(e.target.value)}
                        >
                            {businesses.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{userInitial}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{userName}</div>
                        <div className="sidebar-user-email">{userEmail}</div>
                    </div>
                    <button className="sidebar-signout" onClick={signOut} title={t('navLogout')}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 14H3.33A1.33 1.33 0 012 12.67V3.33A1.33 1.33 0 013.33 2H6" />
                            <polyline points="10,12 14,8 10,4" />
                            <line x1="14" y1="8" x2="6" y2="8" />
                        </svg>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    )
}
