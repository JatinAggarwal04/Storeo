import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import BusinessSetup from './pages/BusinessSetup'
import Inventory from './pages/Inventory'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { listBusinesses } from './services/api'

function AppRoutes() {
  const { user, loading: authLoading } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchBusinesses = async () => {
    try {
      const data = await listBusinesses(user?.id)
      setBusinesses(data.businesses || [])
      if (data.businesses?.length > 0 && !activeBusiness) {
        setActiveBusiness(data.businesses[0])
      }
    } catch (err) {
      console.log('Backend not connected yet — running in standalone mode')
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBusinesses()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleBusinessCreated = (business) => {
    setBusinesses(prev => [business, ...prev])
    setActiveBusiness(business)
  }

  const handleBusinessChange = (businessId) => {
    const biz = businesses.find(b => b.id === businessId)
    if (biz) setActiveBusiness(biz)
  }

  if (authLoading) {
    return (
      <div className="app-loader">
        <div className="app-loader-inner">
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout
      businesses={businesses}
      activeBusiness={activeBusiness}
      onBusinessChange={handleBusinessChange}
      user={user}
    >
      <Routes>
        <Route
          path="/"
          element={
            <BusinessSetup
              onBusinessCreated={handleBusinessCreated}
              user={user}
            />
          }
        />
        <Route
          path="/inventory"
          element={<Inventory business={activeBusiness} />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard business={activeBusiness} />}
        />
        <Route
          path="/settings"
          element={
            <Settings business={activeBusiness} user={user} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
