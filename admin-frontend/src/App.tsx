/**
 * ADMIN CONSOLE PRINCIPAL APPLICATION
 * 
 * Purpose: Provides the administrator panel to manage the database inventory (venues),
 * assign vendors, toggle featured status, and view popularity and applicant activity reports
 * using GraphQL mutations and queries.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Admin Dev Server:
 *   npm run dev
 * - Build Admin Frontend bundle:
 *   npm run build
 * - Preview production build:
 *   npm run preview
 */

import React, { useState, useEffect } from 'react'
import { graphqlFetch } from './utils/graphql'

interface Venue {
  id: string
  vendorId: string
  name: string
  location: string
  capacity: number
  suitability: string[]
  description: string
  imageUrl: string
  pricePerHour: number
  isBlocked: boolean
  isFeatured: boolean
}

interface Vendor {
  id: string
  email: string
  name: string
  role: string
}

interface PopularityReport {
  venueId: string
  venueName: string
  popularDay: string
  popularTimeSlot: string
  successfulBookingsCount: number
}

interface ApplicantReport {
  hirerId: string
  hirerName: string
  successfulBookingsCount: number
  submittedApplicationsCount: number
  activityRatio: number
}

const ALL_SUITABILITIES = [
  'Weddings', 'Corporate Events', 'Galas', 'Cocktail Parties',
  'Birthday Celebrations', 'Casual Gatherings', 'Conferences',
  'Exhibitions', 'Product Launches', 'Expos', 'Trade Shows',
  'Music Events', 'Creative Workshops', 'Social Events',
  'Garden Parties', 'Art Exhibitions', 'tennis', 'dinner', 'classical music',
  'rock concert'
]

type Tab = 'venues' | 'popularity' | 'applicants'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'))
  const [adminUser, setAdminUser] = useState<any>(null)

  // Login Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // App States
  const [activeTab, setActiveTab] = useState<Tab>('venues')
  const [venues, setVenues] = useState<Venue[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [popularityReport, setPopularityReport] = useState<PopularityReport[]>([])
  const [applicantReport, setApplicantReport] = useState<ApplicantReport[]>([])
  const [loading, setLoading] = useState(false)

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [suitability, setSuitability] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Check login state
  useEffect(() => {
    if (token) {
      // Explanatory comment: I decode the JWT token payload client-side via `atob()` to extract
      // basic user details (name, email, role). This avoids requesting the backend for profile details
      // on every initial load, since the signature has already been validated.
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setAdminUser(payload)
      } catch (e) {
        handleLogout()
      }
    }
  }, [token])

  // Fetch data depending on active tab
  useEffect(() => {
    if (token) {
      if (activeTab === 'venues') {
        fetchVenues()
        fetchVendors()
      } else if (activeTab === 'popularity') {
        fetchPopularityReport()
      } else if (activeTab === 'applicants') {
        fetchApplicantReport()
      }
    }
  }, [token, activeTab])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setAdminUser(null)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    const query = `
      query AdminLogin($email: String!, $password: String!) {
        adminLogin(email: $email, password: $password) {
          token
          user {
            id
            email
            name
            role
          }
        }
      }
    `

    try {
      // Explanatory comment: I route this query through my central `graphqlFetch` utility, which
      // handles HTTP POST formatting, JWT authentication headers, and standard Apollo-like error mapping.
      const data = await graphqlFetch(query, { email, password })
      localStorage.setItem('admin_token', data.adminLogin.token)
      setToken(data.adminLogin.token)
      setAdminUser(data.adminLogin.user)
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // GraphQL Operations
  const fetchVenues = async () => {
    setLoading(true)
    const query = `
      query GetVenues {
        getAllVenues {
          id
          vendorId
          name
          location
          capacity
          suitability
          description
          imageUrl
          pricePerHour
          isBlocked
          isFeatured
        }
      }
    `
    try {
      const data = await graphqlFetch(query)
      setVenues(data.getAllVenues)
    } catch (err) {
      console.error('Failed to load venues', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    const query = `
      query GetVendors {
        getAllVendors {
          id
          email
          name
          role
        }
      }
    `
    try {
      const data = await graphqlFetch(query)
      setVendors(data.getAllVendors)
    } catch (err) {
      console.error('Failed to load vendors', err)
    }
  }

  const fetchPopularityReport = async () => {
    setLoading(true)
    const query = `
      query GetPopularity {
        generateReportPopularity {
          venueId
          venueName
          popularDay
          popularTimeSlot
          successfulBookingsCount
        }
      }
    `
    try {
      const data = await graphqlFetch(query)
      setPopularityReport(data.generateReportPopularity)
    } catch (err) {
      console.error('Failed to load popularity report', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicantReport = async () => {
    setLoading(true)
    const query = `
      query GetApplicants {
        generateReportActiveApplicants {
          hirerId
          hirerName
          successfulBookingsCount
          submittedApplicationsCount
          activityRatio
        }
      }
    `
    try {
      const data = await graphqlFetch(query)
      setApplicantReport(data.generateReportActiveApplicants)
    } catch (err) {
      console.error('Failed to load applicant report', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeatured = async (venueId: string, currentFeatured: boolean) => {
    const mutation = `
      mutation ToggleFeatured($venueId: String!, $isFeatured: Boolean!) {
        setVenueFeatured(venueId: $venueId, isFeatured: $isFeatured) {
          id
          isFeatured
        }
      }
    `
    try {
      await graphqlFetch(mutation, { venueId, isFeatured: !currentFeatured })
      fetchVenues()
    } catch (err) {
      alert('Failed to modify featured status')
    }
  }

  const handleAssignVendor = async (venueId: string, vendorId: string) => {
    if (!vendorId) return
    const mutation = `
      mutation AssignVendor($venueId: String!, $vendorId: String!) {
        assignVendorToVenue(venueId: $venueId, vendorId: $vendorId) {
          id
          vendorId
        }
      }
    `
    try {
      await graphqlFetch(mutation, { venueId, vendorId })
      alert('Vendor reassigned successfully!')
      fetchVenues()
    } catch (err: any) {
      alert(err.message || 'Error occurred assigning vendor')
    }
  }

  const handleDeleteVenue = async (venueId: string) => {
    if (!window.confirm('Delete this venue permanently from the database?')) return
    const mutation = `
      mutation DeleteVenue($id: String!) {
        deleteVenue(id: $id)
      }
    `
    try {
      await graphqlFetch(mutation, { id: venueId })
      alert('Venue deleted successfully.')
      fetchVenues()
    } catch (err) {
      alert('Failed to delete venue')
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !location || !capacity || !pricePerHour) {
      alert('Please fill out all required fields')
      return
    }

    const payload = {
      name: name.trim(),
      location: location.trim(),
      capacity: parseInt(capacity, 10),
      suitability,
      description: description.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      pricePerHour: parseFloat(pricePerHour)
    }

    if (editingVenue) {
      const mutation = `
        mutation EditVenue(
          $id: String!
          $name: String
          $location: String
          $capacity: Int
          $suitability: [String!]
          $description: String
          $imageUrl: String
          $pricePerHour: Float
        ) {
          editVenue(
            id: $id
            name: $name
            location: $location
            capacity: $capacity
            suitability: $suitability
            description: $description
            imageUrl: $imageUrl
            pricePerHour: $pricePerHour
          ) {
            id
          }
        }
      `
      try {
        await graphqlFetch(mutation, { id: editingVenue.id, ...payload })
        alert('Venue updated successfully.')
        closeModal()
        fetchVenues()
      } catch (err) {
        alert('Failed to update venue.')
      }
    } else {
      const mutation = `
        mutation AddVenue(
          $name: String!
          $location: String!
          $capacity: Int!
          $suitability: [String!]!
          $description: String!
          $imageUrl: String!
          $pricePerHour: Float!
        ) {
          addVenue(
            name: $name
            location: $location
            capacity: $capacity
            suitability: $suitability
            description: $description
            imageUrl: $imageUrl
            pricePerHour: $pricePerHour
          ) {
            id
          }
        }
      `
      try {
        await graphqlFetch(mutation, payload)
        alert('Venue added successfully.')
        closeModal()
        fetchVenues()
      } catch (err) {
        alert('Failed to add venue.')
      }
    }
  }

  const openAddModal = () => {
    setEditingVenue(null)
    setName('')
    setLocation('')
    setCapacity('')
    setPricePerHour('')
    setSuitability([])
    setDescription('')
    setImageUrl('')
    setIsModalOpen(true)
  }

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue)
    setName(venue.name)
    setLocation(venue.location)
    setCapacity(String(venue.capacity))
    setPricePerHour(String(venue.pricePerHour))
    setSuitability(venue.suitability || [])
    setDescription(venue.description || '')
    setImageUrl(venue.imageUrl || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVenue(null)
  }

  const toggleSuitabilityTag = (tag: string) => {
    if (suitability.includes(tag)) {
      setSuitability(suitability.filter(t => t !== tag))
    } else {
      setSuitability([...suitability, tag])
    }
  }

  // Render Login view
  if (!token) {
    return (
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          background:
            'radial-gradient(circle at top left, rgba(14,165,233,.14), transparent 35%), linear-gradient(160deg, #F8FAFC 0%, #E0F2FE 100%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, var(--charcoal), var(--olive))',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="material-icons" style={{ color: '#fff', fontSize: '1.8rem' }}>
                admin_panel_settings
              </span>
            </div>
            <h2 style={{ marginBottom: '0.4rem' }}>Administrator Login</h2>
            <p>GraphQL Operations Control Panel</p>
          </div>

          {loginError && (
            <div className="alert alert-error animate-fade">
              <span className="material-icons" style={{ fontSize: '1.25rem' }}>error</span>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="card">
            <div className="card-body" style={{ padding: '2.25rem' }}>
              <div className="form-group">
                <label className="form-label">Username / Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                <span className="material-icons">login</span>
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  // Render Dashboard shell
  return (
    <>
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
        <div className="container flex-between" style={{ height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-icons" style={{ color: 'var(--charcoal-light)', fontSize: '1.6rem' }}>security</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Venue<span style={{ color: 'var(--charcoal-light)' }}>Vendors</span> <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginLeft: '0.5rem' }}>Admin Console</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                color: 'rgba(255,255,255,.6)',
                fontSize: '0.85rem',
                borderLeft: '1px solid rgba(255,255,255,.15)',
                paddingLeft: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>account_circle</span>
              {adminUser?.name || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', borderRadius: '20px' }}
            >
              <span className="material-icons" style={{ fontSize: '0.95rem' }}>logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 56, height: 56,
                background: 'var(--charcoal)',
                borderRadius: 'var(--r-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <span className="material-icons" style={{ fontSize: '2rem' }}>admin_panel_settings</span>
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.15rem' }}>
                {adminUser?.name || 'Administrator'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.9rem' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>verified</span>{' '}
                System Administrator · {adminUser?.email || 'admin@vv.com'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ flex: 1 }}>
        <div className="dashboard">
          {/* Sidebar */}
          <aside className="dashboard-sidebar animate-fade">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Database Control
            </p>
            <nav className="sidebar-nav">
              <button className={`sidebar-nav-btn${activeTab === 'venues' ? ' active' : ''}`} onClick={() => setActiveTab('venues')}>
                <span className="material-icons">storefront</span>
                Venues Catalog
              </button>
              <button className={`sidebar-nav-btn${activeTab === 'popularity' ? ' active' : ''}`} onClick={() => setActiveTab('popularity')}>
                <span className="material-icons">bar_chart</span>
                Report: Popularity
              </button>
              <button className={`sidebar-nav-btn${activeTab === 'applicants' ? ' active' : ''}`} onClick={() => setActiveTab('applicants')}>
                <span className="material-icons">group</span>
                Report: Applicant Ratios
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="dashboard-main animate-fade">
            {loading && (
              <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '1rem' }}>
                <span className="material-icons animate-spin" style={{ fontSize: '3rem', color: 'var(--charcoal)' }}>sync</span>
                <p style={{ color: 'var(--text-muted)' }}>Querying GraphQL service...</p>
              </div>
            )}

            {!loading && activeTab === 'venues' && (
              <div>
                <div className="flex-between" style={{ marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Venues Inventory</h2>
                    <p>Add, edit, assign, or delete venues directly via GraphQL mutations</p>
                  </div>
                  <button className="btn btn-primary" onClick={openAddModal}>
                    <span className="material-icons">add</span>
                    Add Venue
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {venues.map(v => (
                    <div key={v.id} className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', flexWrap: 'wrap' }}>
                      <img src={v.imageUrl} alt={v.name} style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{v.name}</h3>
                          <span className={`badge ${v.isFeatured ? 'badge-approved' : 'badge-blocked'}`}>
                            {v.isFeatured ? 'Featured' : 'Standard'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          <span className="material-icons" style={{ fontSize: '1rem' }}>place</span> {v.location}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Capacity: <strong>{v.capacity} guests</strong> · Price: <strong>${v.pricePerHour}/hr</strong>
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {v.suitability.map(tag => (
                            <span key={tag} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--charcoal)', fontWeight: 500 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Operations Actions Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 220, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>assignment_ind</span>
                          <select
                            className="form-select"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                            value={v.vendorId}
                            onChange={e => handleAssignVendor(v.id, e.target.value)}
                          >
                            <option value="" disabled>Select Vendor</option>
                            {vendors.map(ven => (
                              <option key={ven.id} value={ven.id}>
                                {ven.name} ({ven.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={`btn btn-sm ${v.isFeatured ? 'btn-outline' : 'btn-primary'}`}
                            style={{ flex: 1, padding: '0.4rem' }}
                            onClick={() => handleToggleFeatured(v.id, v.isFeatured)}
                          >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>star</span>
                            {v.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>

                          <button className="btn btn-sm btn-outline" style={{ padding: '0.4rem' }} onClick={() => openEditModal(v)}>
                            <span className="material-icons" style={{ fontSize: '1rem' }}>edit</span>
                            Edit
                          </button>

                          <button className="btn btn-sm btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDeleteVenue(v.id)}>
                            <span className="material-icons" style={{ fontSize: '1rem' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {venues.length === 0 && (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No venues registered in the database.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'popularity' && (
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>Venue Popularity Report</h2>
                <p style={{ marginBottom: '2rem' }}>Top 3 most popular venues based on confirmed reservations</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {popularityReport.map((rep, idx) => (
                    <div key={rep.venueId} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--charcoal)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{rep.venueName}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUCCESSFUL BOOKINGS</div>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--charcoal)' }}>{rep.successfulBookingsCount} hires</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FAVORITE DAY</div>
                            <strong style={{ color: 'var(--charcoal-dark)' }}>{rep.popularDay}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>POPULAR TIMESLOT</div>
                            <strong style={{ color: 'var(--charcoal-dark)' }}>{rep.popularTimeSlot}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {popularityReport.length === 0 && (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No statistics available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'applicants' && (
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>Applicant Activity Ratios</h2>
                <p style={{ marginBottom: '2rem' }}>Top 3 most active hirers ranked by conversion ratio (Successful Bookings vs Applications Submitted)</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {applicantReport.map((rep, idx) => (
                    <div key={rep.hirerId} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{rep.hirerName}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVITY RATIO</div>
                            <strong style={{ fontSize: '1.15rem', color: 'var(--success)' }}>{(rep.activityRatio * 100).toFixed(0)}% score</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL APPLICATIONS</div>
                            <strong style={{ color: 'var(--charcoal-dark)' }}>{rep.submittedApplicationsCount} submitted</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPROVED BOOKINGS</div>
                            <strong style={{ color: 'var(--charcoal-dark)' }}>{rep.successfulBookingsCount} approved</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {applicantReport.length === 0 && (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No statistics available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div
            className="card animate-fade"
            style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: '0 1rem' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header flex-between">
              <h3 style={{ margin: 0 }}>{editingVenue ? 'Edit Venue' : 'Register New Venue'}</h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={closeModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label className="form-label">Venue Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Melbourne Loft Suite"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Location *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="50 Collins Street, Melbourne"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity (Guests) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={capacity}
                      onChange={e => setCapacity(e.target.value)}
                      placeholder="150"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price per Hour ($) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={pricePerHour}
                      onChange={e => setPricePerHour(e.target.value)}
                      placeholder="400"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Write a brief description of the venue amenities..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Suitability Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', padding: '0.6rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    {ALL_SUITABILITIES.map(tag => {
                      const active = suitability.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleSuitabilityTag(tag)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: active ? 'var(--charcoal)' : 'var(--border)',
                            background: active ? 'var(--bg-subtle)' : '#fff',
                            color: active ? 'var(--charcoal)' : 'var(--text-2)',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <span className="material-icons">check</span>
                    {editingVenue ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
