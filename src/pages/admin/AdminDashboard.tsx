import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { graphqlFetch } from '../../utils/graphql'
import Navbar from '../../components/layout/Navbar'
import type { Venue } from '../../types'

type Tab = 'venues' | 'popularity' | 'applicants'

export default function AdminDashboard() {
  const { currentUser, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  // Authentication states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Core Admin states
  const [activeTab, setActiveTab] = useState<Tab>('venues')
  const [venues, setVenues] = useState<Venue[]>([])
  const [popReport, setPopReport] = useState<any[]>([])
  const [appReport, setAppReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // CRUD & Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [suitability, setSuitability] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')

  const isAdmin = currentUser && currentUser.role === 'admin'

  // Admin login via GraphQL query
  const handleAdminLogin = async (e: React.FormEvent) => {
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
      const data = await graphqlFetch(query, { email, password })
      localStorage.setItem('vv_token', data.adminLogin.token)
      await refreshUser()
    } catch (err: any) {
      console.error(err)
      setLoginError(err.message || 'Login failed. Authorized administrators only.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch all venues via GraphQL
  const fetchVenues = async () => {
    setLoading(true)
    const query = `
      query GetAllVenues {
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
      console.error('Error fetching venues:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Report 1: Venue Popularity via GraphQL
  const fetchPopularityReport = async () => {
    setLoading(true)
    const query = `
      query GetPopularityReport {
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
      setPopReport(data.generateReportPopularity)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Report 2: Hirer Activity via GraphQL
  const fetchApplicantReport = async () => {
    setLoading(true)
    const query = `
      query GetApplicantReport {
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
      setAppReport(data.generateReportActiveApplicants)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'venues') fetchVenues()
      if (activeTab === 'popularity') fetchPopularityReport()
      if (activeTab === 'applicants') fetchApplicantReport()
    }
  }, [isAdmin, activeTab])

  // Featured toggle via GraphQL mutation
  const toggleFeatured = async (venueId: string, currentFeatured: boolean) => {
    const mutation = `
      mutation SetVenueFeatured($venueId: String!, $isFeatured: Boolean!) {
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
      console.error(err)
      alert('Failed to toggle featured status.')
    }
  }

  // Vendor assignment via GraphQL mutation
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
      alert('Vendor successfully assigned to venue!')
      fetchVenues()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to reassign vendor.')
    }
  }

  // CRUD: Add or Edit Venue Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !location || !capacity || !pricePerHour) {
      alert('Please fill out all required fields.')
      return
    }

    const suitabilityArray = suitability.split(',').map(s => s.trim()).filter(Boolean)

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
        await graphqlFetch(mutation, {
          id: editingVenue.id,
          name,
          location,
          capacity: parseInt(capacity, 10),
          suitability: suitabilityArray,
          description,
          imageUrl,
          pricePerHour: parseFloat(pricePerHour),
        })
        alert('Venue updated successfully!')
        closeModal()
        fetchVenues()
      } catch (err) {
        console.error(err)
        alert('Failed to edit venue.')
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
        await graphqlFetch(mutation, {
          name,
          location,
          capacity: parseInt(capacity, 10),
          suitability: suitabilityArray,
          description,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
          pricePerHour: parseFloat(pricePerHour),
        })
        alert('Venue added successfully!')
        closeModal()
        fetchVenues()
      } catch (err) {
        console.error(err)
        alert('Failed to add venue.')
      }
    }
  }

  // CRUD: Delete Venue via GraphQL mutation
  const handleDeleteVenue = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this venue?')) return

    const mutation = `
      mutation DeleteVenue($id: String!) {
        deleteVenue(id: $id)
      }
    `
    try {
      await graphqlFetch(mutation, { id })
      alert('Venue deleted successfully.')
      fetchVenues()
    } catch (err) {
      console.error(err)
      alert('Failed to delete venue.')
    }
  }

  const openAddModal = () => {
    setEditingVenue(null)
    setName('')
    setLocation('')
    setCapacity('')
    setSuitability('')
    setDescription('')
    setImageUrl('')
    setPricePerHour('')
    setIsModalOpen(true)
  }

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue)
    setName(venue.name)
    setLocation(venue.location)
    setCapacity(String(venue.capacity))
    setSuitability(venue.suitability.join(', '))
    setDescription(venue.description)
    setImageUrl(venue.imageUrl)
    setPricePerHour(String(venue.pricePerHour))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVenue(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/sign-in')
  }

  // 1. NOT LOGGED IN AS ADMIN: RENDER LOGIN PANEL
  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <section
          style={{
            minHeight: 'calc(100vh - 180px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1.5rem',
            background: 'radial-gradient(circle at center, rgba(92,107,69,.12), transparent 70%), #0F172A',
          }}
        >
          <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #1E293B, #5C6B45)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                <span className="material-icons" style={{ color: '#fff', fontSize: '1.8rem' }}>
                  admin_panel_settings
                </span>
              </div>
              <h2 style={{ color: '#fff', marginBottom: '0.4rem' }}>Admin Console</h2>
              <p style={{ color: '#94A3B8' }}>GraphQL Database Operations Control Center</p>
            </div>

            {loginError && (
              <div className="alert alert-error animate-fade" style={{ background: '#7F1D1D', border: '1px solid #B91C1C', color: '#FECACA' }}>
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>error</span>
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="card" style={{ background: '#1E293B', border: '1px solid #334155', color: '#fff' }}>
              <div className="card-body" style={{ padding: '2rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94A3B8' }}>Admin Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@vv.com"
                    style={{ background: '#0F172A', border: '1px solid #334155', color: '#fff' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ color: '#94A3B8' }}>Admin Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ background: '#0F172A', border: '1px solid #334155', color: '#fff' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ width: '100%', background: '#5C6B45', borderColor: '#5C6B45', color: '#fff' }}
                >
                  <span className="material-icons">vpn_key</span>
                  {isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </>
    )
  }

  // 2. AUTHENTICATED ADMIN PANEL
  return (
    <>
      <Navbar />
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderBottom: '1px solid #334155' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 56, height: 56,
                  background: 'var(--olive)',
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.8rem' }}>admin_panel_settings</span>
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.15rem', color: '#fff' }}>
                  Admin Workspace
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                  Logged in as <strong>{currentUser?.name}</strong> · All DB operations executed via **GraphQL**
                </p>
              </div>
            </div>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleLogout}>
              <span className="material-icons">logout</span>
              Exit Admin Panel
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
        <div className="dashboard">
          
          {/* Admin Navigation Sidebar */}
          <aside className="dashboard-sidebar">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Administrative Actions
            </p>
            <nav className="sidebar-nav">
              <button className={`sidebar-nav-btn${activeTab === 'venues' ? ' active' : ''}`} onClick={() => setActiveTab('venues')}>
                <span className="material-icons">domain</span>
                Manage Venues (CRUD)
              </button>
              <button className={`sidebar-nav-btn${activeTab === 'popularity' ? ' active' : ''}`} onClick={() => setActiveTab('popularity')}>
                <span className="material-icons">trending_up</span>
                Report: Venue Popularity
              </button>
              <button className={`sidebar-nav-btn${activeTab === 'applicants' ? ' active' : ''}`} onClick={() => setActiveTab('applicants')}>
                <span className="material-icons">analytics</span>
                Report: Applicant Activity
              </button>
            </nav>
          </aside>

          {/* Main Dashboard Content */}
          <div className="dashboard-main animate-fade" style={{ flex: 1 }}>
            
            {loading && <p className="text-center text-muted" style={{ padding: '2rem' }}>Processing GraphQL database queries...</p>}

            {!loading && activeTab === 'venues' && (
              <div>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <h3>Venues Catalog</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Direct GraphQL CRUD access to venue inventory</p>
                  </div>
                  <button className="btn btn-primary" onClick={openAddModal}>
                    <span className="material-icons">add</span>
                    Register New Venue
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {venues.map(v => (
                    <div key={v.id} className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem', flexWrap: 'wrap' }}>
                      <img src={v.imageUrl} alt={v.name} style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                      
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <h4 style={{ margin: 0 }}>{v.name}</h4>
                          <span className={`badge ${(v.isFeatured || false) ? 'badge-approved' : 'badge-blocked'}`}>
                            {(v.isFeatured || false) ? 'Featured' : 'Standard'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.4rem' }}>
                          <span className="material-icons" style={{ fontSize: '0.95rem' }}>place</span> {v.location}
                        </p>
                        <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-2)' }}>
                          Capacity: <strong>{v.capacity} guests</strong> · ${v.pricePerHour}/hr · Vendor ID: <strong>{v.vendorId}</strong>
                        </p>
                      </div>

                      {/* Administrative Actions Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 200, justifyContent: 'center' }}>
                        
                        {/* Assign Vendor Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>assignment_ind</span>
                          <select
                            className="form-select"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '100%' }}
                            value={v.vendorId}
                            onChange={e => handleAssignVendor(v.id, e.target.value)}
                          >
                            <option value="vendor-001">Assign Anand Prabu (vendor-001)</option>
                            <option value="vendor-002">Assign Soosai Rajan (vendor-002)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={`btn btn-sm ${(v.isFeatured || false) ? 'btn-outline' : 'btn-primary'}`}
                            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => toggleFeatured(v.id, v.isFeatured || false)}
                          >
                            <span className="material-icons" style={{ fontSize: '0.9rem' }}>star</span>
                            {(v.isFeatured || false) ? 'Unfeature' : 'Feature'}
                          </button>
                          
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => openEditModal(v)}
                          >
                            <span className="material-icons" style={{ fontSize: '0.9rem' }}>edit</span>
                            Edit
                          </button>
                          
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                            onClick={() => handleDeleteVenue(v.id)}
                          >
                            <span className="material-icons" style={{ fontSize: '0.9rem' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && activeTab === 'popularity' && (
              <div>
                <h3>Venue Popularity Analytics</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  Top 3 most popular venues based on approved bookings count with favorite weekdays and time slots. (Fetched exclusively via GraphQL Reports)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {popReport.map((item, idx) => (
                    <div key={item.venueId} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--olive)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'var(--olive)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem',
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.35rem 0' }}>{item.venueName}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bookings</div>
                            <strong style={{ color: 'var(--charcoal)', fontSize: '1.1rem' }}>{item.successfulBookingsCount} successful</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Popular Day</div>
                            <strong style={{ color: 'var(--charcoal)' }}>{item.popularDay}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Popular Slot</div>
                            <strong style={{ color: 'var(--charcoal)' }}>{item.popularTimeSlot}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && activeTab === 'applicants' && (
              <div>
                <h3>Applicant Activity Analytics</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  Top 3 most active applicants based on ratio of successful bookings to total applications submitted. (Fetched exclusively via GraphQL Reports)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {appReport.map((item, idx) => (
                    <div key={item.hirerId} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--charcoal)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'var(--charcoal)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem',
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.35rem 0' }}>{item.hirerName}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activity Ratio</div>
                            <strong style={{ color: 'var(--olive)', fontSize: '1.15rem' }}>{(item.activityRatio * 100).toFixed(0)}% score</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Submissions</div>
                            <strong style={{ color: 'var(--charcoal)' }}>{item.submittedApplicationsCount} applications</strong>
                          </div>
                          <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Hires</div>
                            <strong style={{ color: 'var(--charcoal)' }}>{item.successfulBookingsCount} approved</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* CRUD MODAL FOR ADDING/EDITING VENUE */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              <h4>{editingVenue ? 'Edit Venue Registration' : 'Register New Venue'}</h4>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label className="form-label">Venue Name *</label>
                  <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Melbourne Assembly Loft" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location Address *</label>
                  <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. 50 Collins Street, Melbourne" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity (Guests) *</label>
                    <input type="number" className="form-input" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 200" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price per Hour ($) *</label>
                    <input type="number" className="form-input" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} placeholder="e.g. 450" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Suitability Tags (comma separated)</label>
                  <input type="text" className="form-input" value={suitability} onChange={e => setSuitability(e.target.value)} placeholder="e.g. Weddings, Gala, Cocktail" />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input type="text" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="e.g. https://images.unsplash.com/..." />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Description Description</label>
                  <textarea className="form-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter details about amenities, AV layout, Stage area..." />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <span className="material-icons">save</span>
                    {editingVenue ? 'Update Venue' : 'Register Venue'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
