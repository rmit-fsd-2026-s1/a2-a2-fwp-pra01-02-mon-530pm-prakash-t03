/**
 * VENUE VENDORS CLIENT APP - VENUERANKINGS.TSX
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getRankingByHirer, saveRankingForHirer } from '../../utils/storage'
import { api } from '../../utils/api'
import type { Venue } from '../../types'

export default function VenueRankings() {
  const { currentUser } = useAuth()
  const [ranked, setRanked] = useState<Venue[]>([])
  const [pool, setPool] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  const existingRanking = currentUser ? getRankingByHirer(currentUser.id) : undefined

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const data = await api.getVenues()
        const unblocked = data.filter(v => !v.isBlocked)

        if (existingRanking?.rankings.length) {
          const sortedRanked = existingRanking.rankings
            .sort((a, b) => a.rank - b.rank)
            .map(r => unblocked.find(v => v.id === r.venueId))
            .filter(Boolean) as Venue[]
          setRanked(sortedRanked)

          const rankedIds = new Set(sortedRanked.map(v => v.id))
          setPool(unblocked.filter(v => !rankedIds.has(v.id)))
        } else {
          setPool(unblocked)
        }
      } catch (err) {
        console.error('Failed to load venues for ranking:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVenues()
  }, [currentUser])

  const [saved, setSaved] = useState(false)

  const addToRanked = (venue: Venue) => {
    setPool(p => p.filter(v => v.id !== venue.id))
    setRanked(r => [...r, venue])
  }

  const removeFromRanked = (venue: Venue) => {
    setRanked(r => r.filter(v => v.id !== venue.id))
    setPool(p => [...p, venue])
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const arr = [...ranked]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    setRanked(arr)
  }

  const moveDown = (idx: number) => {
    if (idx === ranked.length - 1) return
    const arr = [...ranked]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    setRanked(arr)
  }

  const handleSave = () => {
    if (!currentUser) return
    saveRankingForHirer({
      hirerId: currentUser.id,
      rankings: ranked.map((v, i) => ({ venueId: v.id, rank: i + 1, venueName: v.name })),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.35rem' }}>My Venue Rankings</h2>
      <p style={{ marginBottom: '2rem' }}>
        Add venues from the pool below and arrange them in your order of preference.
      </p>

      {saved && (
        <div className="alert alert-success animate-fade">
          <span className="material-icons">check_circle</span>
          Rankings saved successfully!
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted" style={{ padding: '3rem' }}>Loading venues list...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Ranked list */}
        <div className="card">
          <div className="card-header">
            <h4>
              <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--olive)' }}>
                format_list_numbered
              </span>
              My Ranked Choices
            </h4>
            <span className="badge badge-charcoal">{ranked.length}</span>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            {ranked.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <span className="material-icons" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>
                  add_circle_outline
                </span>
                <p style={{ fontSize: '0.875rem' }}>Add venues from the pool to start ranking</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ranked.map((v, i) => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--r)',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'var(--charcoal)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {v.capacity} pax · ${v.pricePerHour}/hr
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.15rem' }} onClick={() => moveUp(i)} disabled={i === 0}>
                        <span className="material-icons" style={{ fontSize: '0.9rem' }}>keyboard_arrow_up</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.15rem' }} onClick={() => moveDown(i)} disabled={i === ranked.length - 1}>
                        <span className="material-icons" style={{ fontSize: '0.9rem' }}>keyboard_arrow_down</span>
                      </button>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--error)' }}
                      onClick={() => removeFromRanked(v)}
                    >
                      <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {ranked.length > 0 && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleSave}>
                <span className="material-icons">save</span>
                Save Rankings
              </button>
            )}
          </div>
        </div>

        {/* Venue pool */}
        <div className="card">
          <div className="card-header">
            <h4>
              <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--text-muted)' }}>
                domain
              </span>
              Available Venues
            </h4>
            <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>{pool.length}</span>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            {pool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                All venues have been added to your ranking list.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pool.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--r)',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {v.capacity} pax · ${v.pricePerHour}/hr
                      </div>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => addToRanked(v)}
                    >
                      <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
                      Rank
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
