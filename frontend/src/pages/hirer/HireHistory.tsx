/**
 * VENUE VENDORS CLIENT APP - HIREHISTORY.TSX
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
import { api } from '../../utils/api'
import StarRating from '../../components/StarRating'

export default function HireHistory() {
  const { currentUser } = useAuth()
  const [history, setHistory] = useState<any[]>([])
  const [reputation, setReputation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    api.getHistoryByHirer(currentUser.id)
      .then(res => {
        setHistory(res.history || [])
        setReputation(res.reputation || 0)
        setError(null)
      })
      .catch(err => {
        console.error('Failed to fetch hire history:', err)
        setError('Failed to load hire history records.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [currentUser])

  if (loading) {
    return <p className="text-center text-muted" style={{ padding: '3rem' }}>Loading hire history...</p>
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '1rem 0' }}>
        <span className="material-icons" style={{ fontSize: '1.1rem' }}>error</span>
        {error}
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.35rem' }}>Hire History</h2>
      <p style={{ marginBottom: '2rem' }}>
        Your historical record of venue hires and reputation ratings.
      </p>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: 'history', label: 'Total Hires', value: history.length },
          { icon: 'star', label: 'Avg. Rating', value: `${reputation.toFixed(1)} / 5` },
          {
            icon: 'emoji_events',
            label: 'Best Rating',
            value: history.length ? `${Math.max(...history.map(h => h.rating))} / 5` : 'N/A',
          },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div className="card-body">
              <span className="material-icons" style={{ fontSize: '1.75rem', color: 'var(--olive)', display: 'block', marginBottom: '0.4rem' }}>
                {s.icon}
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div className="card">
          <div className="card-body text-center" style={{ padding: '3rem' }}>
            <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
              history
            </span>
            <h4>No Hire History Yet</h4>
            <p>Once your venue applications are approved and events are completed, they'll appear here.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h4>
              <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>history</span>
              Past Hires
            </h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {['Venue Name', 'Location', 'Event Name', 'Date of Hire', 'Rating'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left', padding: '0.75rem 1.25rem',
                        fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={h.id}
                    style={{
                      borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background var(--t-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--charcoal)' }}>
                      {h.venueName}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                      {h.venueLocation.split(',').slice(-2).join(',').trim()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem' }}>
                      {h.eventName}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                      {new Date(h.dateOfHire).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StarRating value={h.rating} readOnly size="sm" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.rating}/5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
