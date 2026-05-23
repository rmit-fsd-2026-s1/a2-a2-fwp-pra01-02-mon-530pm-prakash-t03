import { useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import HirerProfile from './HirerProfile'
import BrowseVenues from './BrowseVenues'
import VenueRankings from './VenueRankings'
import ApplyForVenue from './ApplyForVenue'
import HireHistory from './HireHistory'
import HirerDocuments from './HirerDocuments'

type Tab =
  | 'profile'
  | 'browse'
  | 'rankings'
  | 'apply'
  | 'history'
  | 'documents'

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: 'profile',   icon: 'manage_accounts', label: 'My Profile' },
  { id: 'browse',    icon: 'explore',          label: 'Browse Venues' },
  { id: 'rankings',  icon: 'format_list_numbered', label: 'My Rankings' },
  { id: 'apply',     icon: 'send',             label: 'Apply for Venue' },
  { id: 'history',   icon: 'history',          label: 'Hire History' },
  { id: 'documents', icon: 'folder_open',      label: 'My Documents' },
]

export default function HirerDashboard() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':   return <HirerProfile />
      case 'browse':    return <BrowseVenues onApply={() => setActiveTab('apply')} />
      case 'rankings':  return <VenueRankings />
      case 'apply':     return <ApplyForVenue />
      case 'history':   return <HireHistory />
      case 'documents': return <HirerDocuments />
      default:          return null
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 56, height: 56,
                background: 'var(--olive)',
                borderRadius: 'var(--r-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.15rem' }}>
                {currentUser?.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.9rem' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>badge</span>{' '}
                Hirer Account · {currentUser?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="dashboard">
          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Navigation
            </p>
            <nav className="sidebar-nav">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`sidebar-nav-btn${activeTab === item.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="material-icons">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="dashboard-main animate-fade">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}
