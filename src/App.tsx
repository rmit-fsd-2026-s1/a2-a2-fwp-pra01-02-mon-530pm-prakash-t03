import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import HirerDashboard from './pages/hirer/HirerDashboard'
import VendorDashboard from './pages/vendor/VendorDashboard'

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'hirer' | 'vendor'
}) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/sign-in" replace />
  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === 'hirer' ? '/hirer' : '/vendor'} replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { currentUser } = useAuth()
  return (
    <div className="page-wrapper">
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/sign-in"
            element={
              currentUser ? (
                <Navigate to={currentUser.role === 'hirer' ? '/hirer' : '/vendor'} replace />
              ) : (
                <SignIn />
              )
            }
          />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/hirer/*"
            element={
              <ProtectedRoute role="hirer">
                <HirerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/*"
            element={
              <ProtectedRoute role="vendor">
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
