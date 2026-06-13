/**
 * VENDOR VENUE MANAGEMENT PAGE
 * 
 * Purpose: Allows vendors to manage (CRUD) their own venues, block them,
 * and assign suitability tags using a premium multi-select dropdown menu.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server:
 *   npm run dev
 * - Build Frontend bundle:
 *   npm run build
 * - Run Frontend Unit Tests:
 *   npm run test
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateVenue } from '../../utils/storage'
import { api } from '../../utils/api'
import type { Venue } from '../../types'

const ALL_SUITABILITIES = [
  'Weddings', 'Corporate Events', 'Galas', 'Cocktail Parties',
  'Birthday Celebrations', 'Casual Gatherings', 'Conferences',
  'Exhibitions', 'Product Launches', 'Expos', 'Trade Shows',
  'Music Events', 'Creative Workshops', 'Social Events',
  'Garden Parties', 'Art Exhibitions', 'tennis', 'dinner', 'classical music',
  'rock concert'
];

export default function VenueManagement() {
  const { currentUser } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [blocking, setBlocking] = useState<string | null>(null)
  const [blockFrom, setBlockFrom] = useState('')
  const [blockUntil, setBlockUntil] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({})

  // Add/Edit Venue states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [suitability, setSuitability] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})

  const openAddModal = () => {
    setEditingVenue(null)
    setName('')
    setLocation('')
    setCapacity('')
    setSuitability([])
    setDescription('')
    setImageUrl('')
    setPricePerHour('')
    setAddErrors({})
    setIsAddModalOpen(true)
  }

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue)
    setName(venue.name)
    setLocation(venue.location)
    setCapacity(String(venue.capacity))
    setSuitability(venue.suitability || [])
    setDescription(venue.description)
    setImageUrl(venue.imageUrl)
    setPricePerHour(String(venue.pricePerHour))
    setAddErrors({})
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setEditingVenue(null)
  }

  const handleSaveVenue = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Venue name is required.'
    if (!location.trim()) errs.location = 'Location is required.'
    if (!capacity.trim() || isNaN(Number(capacity)) || Number(capacity) <= 0) {
      errs.capacity = 'Please enter a valid capacity.'
    }
    if (!pricePerHour.trim() || isNaN(Number(pricePerHour)) || Number(pricePerHour) <= 0) {
      errs.pricePerHour = 'Please enter a valid price per hour.'
    }
    if (suitability.length === 0) errs.suitability = 'Please select at least one suitability tag.'
    if (!description.trim()) errs.description = 'Description is required.'

    setAddErrors(errs)
    if (Object.keys(errs).length > 0) return

    try {
      if (editingVenue) {
        await api.updateVenue(editingVenue.id, {
          name,
          location,
          capacity: parseInt(capacity, 10),
          suitability,
          description,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
          pricePerHour: parseFloat(pricePerHour),
        })
        alert('Venue updated successfully!')
      } else {
        await api.createVenue({
          name,
          location,
          capacity: parseInt(capacity, 10),
          suitability,
          description,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
          pricePerHour: parseFloat(pricePerHour),
        })
        alert('Venue added successfully!')
      }
      closeAddModal()
      refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to save venue.')
    }
  }

  const handleDeleteVenue = async (venueId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this venue?')) return
    try {
      await api.deleteVenue(venueId)
      alert('Venue deleted successfully.')
      refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to delete venue.')
    }
  }

  const refresh = async () => {
    try {
      const data = await api.getVenues()
      setVenues(data.filter(v => v.vendorId === currentUser?.id))
    } catch (err) {
      console.error('Failed to fetch venues:', err)
    }
  }

  useEffect(() => {
    if (currentUser) {
      refresh()
    }
  }, [currentUser])

  const openBlock = (venue: Venue) => {
    setBlocking(venue.id)
    setBlockFrom(venue.blockedFrom ?? '')
    setBlockUntil(venue.blockedUntil ?? '')
    setBlockReason(venue.blockReason ?? '')
    setBlockErrors({})
  }

  const confirmBlock = async () => {
    const errs: Record<string, string> = {}
    if (!blockFrom) errs.from = 'Start date is required.'
    if (!blockUntil) errs.until = 'End date is required.'
    if (blockFrom && blockUntil && blockFrom >= blockUntil) errs.until = 'End date must be after start date.'
    if (!blockReason.trim()) errs.reason = 'Please enter a reason for blocking.'
    setBlockErrors(errs)
    if (Object.keys(errs).length > 0) return

    const venue = venues.find(v => v.id === blocking)
    if (!venue) return

    try {
      await api.updateVenue(venue.id, {
        isBlocked: true,
        blockedFrom: blockFrom,
        blockedUntil: blockUntil,
        blockReason,
      })
      // Sync local storage in case offline mocks fallback on it
      updateVenue({ ...venue, isBlocked: true, blockedFrom: blockFrom, blockedUntil: blockUntil, blockReason })
      setBlocking(null)
      refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to block venue on the server.')
    }
  }

  // Unblocks venue
  const unblock = async (venue: Venue) => {
    try {
      await api.updateVenue(venue.id, {
        isBlocked: false,
        blockedFrom: null as any,
        blockedUntil: null as any,
        blockReason: null as any,
      })
      updateVenue({ ...venue, isBlocked: false, blockedFrom: undefined, blockedUntil: undefined, blockReason: undefined })
      refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to unblock venue on the server.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Manage Venues</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            View, edit, delete, and block your venues.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <span className="material-icons">add</span>
          Add New Venue
        </button>
      </div>

      {venues.length === 0 ? (
        <div className="card">
          <div className="card-body text-center" style={{ padding: '3rem' }}>
            <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>domain_disabled</span>
            <h4>No Venues Found</h4>
            <p>You have no venues assigned to your account.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {venues.map(venue => (
            <div key={venue.id} className="card" style={{ borderLeft: `4px solid ${venue.isBlocked ? 'var(--error)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <img
                  src={venue.imageUrl}
                  alt={venue.name}
                  style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 'var(--r)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0 }}>{venue.name}</h4>
                    <span className={`badge ${venue.isBlocked ? 'badge-blocked' : 'badge-approved'}`}>
                      <span className="material-icons" style={{ fontSize: '0.85rem' }}>
                        {venue.isBlocked ? 'block' : 'check_circle'}
                      </span>
                      {venue.isBlocked ? 'Blocked' : 'Available'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.3rem' }}>
                    <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>place</span>{' '}
                    {venue.location}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0 }}>
                    Capacity: {venue.capacity.toLocaleString()} · ${venue.pricePerHour}/hr
                  </p>

                  {venue.isBlocked && (
                    <div className="alert alert-warning" style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>
                      <span className="material-icons" style={{ fontSize: '1rem' }}>warning</span>
                      <div>
                        <strong>Blocked:</strong> {venue.blockedFrom} — {venue.blockedUntil}
                        <br />
                        Reason: {venue.blockReason}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', height: 'auto' }} onClick={() => openEditModal(venue)}>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>edit</span>
                    Edit
                  </button>
                  <button className="btn btn-danger" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff', padding: '0.35rem 0.75rem', height: 'auto' }} onClick={() => handleDeleteVenue(venue.id)}>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>delete</span>
                    Delete
                  </button>
                  {venue.isBlocked ? (
                    <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', height: 'auto' }} onClick={() => unblock(venue)}>
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>lock_open</span>
                      Unblock
                    </button>
                  ) : (
                    <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.35rem 0.75rem', height: 'auto' }} onClick={() => openBlock(venue)}>
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>block</span>
                      Block
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Block modal */}
      {blocking && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setBlocking(null)}
        >
          <div
            className="card animate-fade"
            style={{ maxWidth: 480, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header">
              <h4>
                <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--error)' }}>block</span>
                Block Venue
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setBlocking(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                Block this venue for a period. It will appear as unavailable to hirers during this time.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Block From *</label>
                  <input
                    type="date"
                    className={`form-input${blockErrors.from ? ' error' : ''}`}
                    value={blockFrom}
                    onChange={e => { setBlockFrom(e.target.value); setBlockErrors(p => ({ ...p, from: undefined! })) }}
                  />
                  {blockErrors.from && <span className="form-error">{blockErrors.from}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Block Until *</label>
                  <input
                    type="date"
                    className={`form-input${blockErrors.until ? ' error' : ''}`}
                    value={blockUntil}
                    onChange={e => { setBlockUntil(e.target.value); setBlockErrors(p => ({ ...p, until: undefined! })) }}
                  />
                  {blockErrors.until && <span className="form-error">{blockErrors.until}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Blocking *</label>
                <textarea
                  className={`form-textarea${blockErrors.reason ? ' error' : ''}`}
                  rows={3}
                  placeholder="e.g. Scheduled maintenance and renovation of main hall facilities"
                  value={blockReason}
                  onChange={e => { setBlockReason(e.target.value); setBlockErrors(p => ({ ...p, reason: undefined! })) }}
                />
                {blockErrors.reason && <span className="form-error">{blockErrors.reason}</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmBlock}>
                  <span className="material-icons">block</span>
                  Confirm Block
                </button>
                <button className="btn btn-outline" onClick={() => setBlocking(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Venue Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={closeAddModal}
        >
          <div
            className="card animate-fade"
            style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header">
              <h4>
                <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--primary)' }}>add_business</span>
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={closeAddModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Venue Name *</label>
                <input
                  type="text"
                  className={`form-input${addErrors.name ? ' error' : ''}`}
                  placeholder="e.g. Grand Plaza Ballroom"
                  value={name}
                  onChange={e => { setName(e.target.value); setAddErrors(p => ({ ...p, name: undefined! })) }}
                />
                {addErrors.name && <span className="form-error">{addErrors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location/Address *</label>
                  <input
                    type="text"
                    className={`form-input${addErrors.location ? ' error' : ''}`}
                    placeholder="e.g. Melbourne, VIC"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setAddErrors(p => ({ ...p, location: undefined! })) }}
                  />
                  {addErrors.location && <span className="form-error">{addErrors.location}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input
                    type="number"
                    className={`form-input${addErrors.capacity ? ' error' : ''}`}
                    placeholder="e.g. 250"
                    value={capacity}
                    onChange={e => { setCapacity(e.target.value); setAddErrors(p => ({ ...p, capacity: undefined! })) }}
                  />
                  {addErrors.capacity && <span className="form-error">{addErrors.capacity}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price Per Hour ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-input${addErrors.pricePerHour ? ' error' : ''}`}
                    placeholder="e.g. 150.00"
                    value={pricePerHour}
                    onChange={e => { setPricePerHour(e.target.value); setAddErrors(p => ({ ...p, pricePerHour: undefined! })) }}
                  />
                  {addErrors.pricePerHour && <span className="form-error">{addErrors.pricePerHour}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Suitability Dropdown *</label>
                  <select
                    className={`form-select${addErrors.suitability ? ' error' : ''}`}
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !suitability.includes(val)) {
                        setSuitability([...suitability, val]);
                        setAddErrors(p => ({ ...p, suitability: undefined! }));
                      }
                    }}
                  >
                    <option value="" disabled>Choose suitability tags...</option>
                    {ALL_SUITABILITIES.map(s => (
                      <option key={s} value={s} disabled={suitability.includes(s)}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {addErrors.suitability && <span className="form-error">{addErrors.suitability}</span>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {suitability.map(s => (
                      <span
                        key={s}
                        className="badge badge-approved"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--bg-subtle)',
                          color: 'var(--charcoal)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {s}
                        <span
                          className="material-icons"
                          style={{ fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onClick={() => setSuitability(suitability.filter(item => item !== s))}
                        >
                          close
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className={`form-textarea${addErrors.description ? ' error' : ''}`}
                  rows={4}
                  placeholder="Provide details about your venue's amenities, features, and accessibility..."
                  value={description}
                  onChange={e => { setDescription(e.target.value); setAddErrors(p => ({ ...p, description: undefined! })) }}
                />
                {addErrors.description && <span className="form-error">{addErrors.description}</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveVenue}>
                  {editingVenue ? 'Save Changes' : 'Create Venue'}
                </button>
                <button className="btn btn-outline" onClick={closeAddModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
