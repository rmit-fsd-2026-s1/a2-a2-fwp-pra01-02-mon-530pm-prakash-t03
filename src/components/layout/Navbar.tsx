import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav
      style={{
        background: '#1C1C1A',
        boxShadow: 'var(--shadow-nav)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Brand */}
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.55rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          Venue<span style={{ color: 'var(--olive)' }}>Vendors</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <NavLink to="/" label="Home" active={location.pathname === '/'} />
          {!currentUser && (
            <>
              <NavLink to="/sign-in" label="Sign In" active={isActive('/sign-in')} />
              <Link to="/sign-up" className="btn btn-accent btn-sm" style={{ marginLeft: '0.5rem', background: '#5C6B45', borderColor: '#5C6B45' }}>
                Sign Up
              </Link>
            </>
          )}
          {currentUser?.role === 'hirer' && (
            <NavLink to="/hirer" label="My Dashboard" active={isActive('/hirer')} />
          )}
          {currentUser?.role === 'vendor' && (
            <NavLink to="/vendor" label="Vendor Panel" active={isActive('/vendor')} />
          )}
          {currentUser && (
            <>
              <span
                style={{
                  color: 'rgba(255,255,255,.6)',
                  fontSize: '0.85rem',
                  marginLeft: '0.5rem',
                  borderLeft: '1px solid rgba(255,255,255,.2)',
                  paddingLeft: '0.75rem',
                }}
              >
                <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4 }}>
                  person
                </span>
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)', marginLeft: '0.25rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>logout</span>
                Sign Out
              </button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="btn btn-ghost btn-sm hamburger"
          style={{ color: '#fff', display: 'none' }}
          aria-label="Toggle menu"
        >
          <span className="material-icons">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: '#111110',
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255,255,255,.1)',
          }}
        >
          <MobileLink to="/" label="Home" onClick={() => setMenuOpen(false)} />
          {!currentUser && (
            <>
              <MobileLink to="/sign-in" label="Sign In" onClick={() => setMenuOpen(false)} />
              <MobileLink to="/sign-up" label="Sign Up" onClick={() => setMenuOpen(false)} />
            </>
          )}
          {currentUser?.role === 'hirer' && (
            <MobileLink to="/hirer" label="My Dashboard" onClick={() => setMenuOpen(false)} />
          )}
          {currentUser?.role === 'vendor' && (
            <MobileLink to="/vendor" label="Vendor Panel" onClick={() => setMenuOpen(false)} />
          )}
          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.6rem 0',
                background: 'none',
                border: 'none',
                color: 'var(--olive)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                cursor: 'pointer',
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
        color: active ? '#fff' : 'rgba(255,255,255,.7)',
        fontWeight: active ? 600 : 400,
        fontSize: '0.93rem',
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--r)',
        background: active ? 'rgba(255,255,255,.12)' : 'transparent',
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
        color: 'rgba(255,255,255,.85)',
        padding: '0.6rem 0',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        fontSize: '0.95rem',
      }}
    >
      {label}
    </Link>
  )
}