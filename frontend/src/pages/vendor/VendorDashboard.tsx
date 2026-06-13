/**
 * VENUE VENDORS CLIENT APP - VENDORDASHBOARD.TSX
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

import { useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import ApplicantsList from './ApplicantsList'
import VenueManagement from './VenueManagement'
import VendorAnalytics from './VendorAnalytics'

type Tab = 'applicants' | 'venues' | 'analytics'

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: 'applicants', icon: 'people',       label: 'Applicants' },
  { id: 'venues',     icon: 'domain',       label: 'Manage Venues' },
  { id: 'analytics',  icon: 'bar_chart',    label: 'Analytics' },
]

export default function VendorDashboard() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('applicants')

  const renderContent = () => {
    switch (activeTab) {
      case 'applicants': return <ApplicantsList />
      case 'venues':     return <VenueManagement />
      case 'analytics':  return <VendorAnalytics />
      default:           return null
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
                fontSize: '1.5rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.15rem' }}>
                {currentUser?.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.9rem' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>verified</span>{' '}
                Venue Vendor · {currentUser?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="dashboard">
          <aside className="dashboard-sidebar">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Vendor Panel
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

          <div className="dashboard-main animate-fade">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}
