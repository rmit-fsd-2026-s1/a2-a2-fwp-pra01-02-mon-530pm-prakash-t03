import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getVenues, updateVenue } from '../../utils/storage'
import type { Venue } from '../../types'

export default function VenueManagement() {
  const { currentUser } = useAuth()
  const [venues, setVenues] = useState(() => getVenues().filter(v => v.vendorId === currentUser?.id))
  const [blocking, setBlocking] = useState<string | null>(null)
  const [blockFrom, setBlockFrom] = useState('')
  const [blockUntil, setBlockUntil] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({})

  const refresh = () => setVenues(getVenues().filter(v => v.vendorId === currentUser?.id))

  const openBlock = (venue: Venue) => {
    setBlocking(venue.id)
    setBlockFrom(venue.blockedFrom ?? '')
    setBlockUntil(venue.blockedUntil ?? '')
    setBlockReason(venue.blockReason ?? '')
    setBlockErrors({})
  }

  const confirmBlock = () => {
    const errs: Record<string, string> = {}
    if (!blockFrom) errs.from = 'Start date is required.'
    if (!blockUntil) errs.until = 'End date is required.'
    if (blockFrom && blockUntil && blockFrom >= blockUntil) errs.until = 'End date must be after start date.'
    if (!blockReason.trim()) errs.reason = 'Please enter a reason for blocking.'
    setBlockErrors(errs)
    if (Object.keys(errs).length > 0) return

    const venue = venues.find(v => v.id === blocking)
    if (!venue) return
    updateVenue({ ...venue, isBlocked: true, blockedFrom: blockFrom, blockedUntil: blockUntil, blockReason })
    setBlocking(null)
    refresh()
  }

  // Unblocks venue
  const unblock = (venue: Venue) => {
    updateVenue({ ...venue, isBlocked: false, blockedFrom: undefined, blockedUntil: undefined, blockReason: undefined })
    refresh()
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.35rem' }}>Manage Venues</h2>
      <p style={{ marginBottom: '2rem' }}>
        View your venues and block them during maintenance or renovation periods.
      </p>

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

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {venue.isBlocked ? (
                    <button className="btn btn-outline" onClick={() => unblock(venue)}>
                      <span className="material-icons">lock_open</span>
                      Unblock
                    </button>
                  ) : (
                    <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => openBlock(venue)}>
                      <span className="material-icons">block</span>
                      Block Venue
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
    </div>
  )
}
