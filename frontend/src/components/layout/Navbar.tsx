/**
 * VENUE VENDORS CLIENT APP - NAVBAR.TSX
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Explanatory comment: I clear local auth tokens and navigate to the SignIn screen.
  // I pass the 'logoutMessage' within the router navigation state. This lets the SignIn 
  // page capture and render a clean dismissal toast/alert without needing global state.
  const handleLogout = () => {
    logout()
    navigate('/sign-in', { state: { logoutMessage: 'You have successfully signed out. Goodbye!' } })
    setMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  // Explanatory comment: I declare the premium glassmorphic capsule design directly using inline styles.
  // This isolates this floating layout structure so that it does not break when page-level 
  // CSS files load, modify, or reset standard layout classes.
  return (
    <nav
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        boxShadow: 'var(--shadow-md)',
        position: 'sticky',
        top: '1rem',
        margin: '1rem auto 1.5rem',
        width: 'calc(100% - 2.5rem)',
        maxWidth: '1200px',
        borderRadius: '50px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        padding: '0.2rem 1rem'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Custom Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none'
          }}
        >
          <span className="material-icons" style={{ color: 'var(--charcoal-light)', fontSize: '1.6rem' }}>place</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Venue<span style={{ color: 'var(--charcoal-light)' }}>Vendors</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <NavLink to="/" label="Home" active={location.pathname === '/'} />
          {!currentUser && (
            <>
              <NavLink to="/sign-in" label="Sign In" active={isActive('/sign-in')} />
              <Link to="/sign-up" className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem', borderRadius: '20px' }}>
                Register
              </Link>
            </>
          )}
          {currentUser?.role === 'hirer' && (
            <NavLink to="/hirer" label="Dashboard" active={isActive('/hirer')} />
          )}
          {currentUser?.role === 'vendor' && (
            <NavLink to="/vendor" label="Management Panel" active={isActive('/vendor')} />
          )}
          {currentUser && (
            <>
              <span
                style={{
                  color: 'rgba(255,255,255,.6)',
                  fontSize: '0.85rem',
                  marginLeft: '0.5rem',
                  borderLeft: '1px solid rgba(255,255,255,.15)',
                  paddingLeft: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>account_circle</span>
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', marginLeft: '0.25rem', borderRadius: '20px' }}
              >
                <span className="material-icons" style={{ fontSize: '0.95rem' }}>logout</span>
                Sign Out
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="btn btn-ghost btn-sm hamburger"
          style={{ color: '#fff', display: 'none' }}
          aria-label="Toggle menu"
        >
          <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div
          style={{
            background: '#111827',
            padding: '1rem',
            borderRadius: '24px',
            marginTop: '0.5rem',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <MobileLink to="/" label="Home" onClick={() => setMenuOpen(false)} />
          {!currentUser && (
            <>
              <MobileLink to="/sign-in" label="Sign In" onClick={() => setMenuOpen(false)} />
              <MobileLink to="/sign-up" label="Register" onClick={() => setMenuOpen(false)} />
            </>
          )}
          {currentUser?.role === 'hirer' && (
            <MobileLink to="/hirer" label="Dashboard" onClick={() => setMenuOpen(false)} />
          )}
          {currentUser?.role === 'vendor' && (
            <MobileLink to="/vendor" label="Management Panel" onClick={() => setMenuOpen(false)} />
          )}
          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.65rem 0.5rem',
                background: 'none',
                border: 'none',
                color: '#EF4444',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      style={{
        color: active ? '#fff' : 'rgba(255,255,255,.65)',
        fontWeight: active ? 600 : 500,
        fontSize: '0.9rem',
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        background: active ? 'rgba(255,255,255,.08)' : 'transparent',
        transition: 'all var(--t-fast)',
      }}
    >
      {label}
    </Link>
  )
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'block',
        color: 'rgba(255,255,255,.8)',
        padding: '0.65rem 0.5rem',
        borderBottom: '1px solid rgba(255,255,255,.05)',
        fontSize: '0.9rem',
        textDecoration: 'none'
      }}
    >
      {label}
    </Link>
  )
}