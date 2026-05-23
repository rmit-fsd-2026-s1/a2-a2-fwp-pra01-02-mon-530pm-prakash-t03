import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateUser } from '../../utils/storage'
import { validateName, validatePhone } from '../../utils/validation'
import { getHirerReputation, getHireHistoryByHirer } from '../../utils/storage'
import StarRating from '../../components/StarRating'

export default function HirerProfile() {
  const { currentUser, refreshUser } = useAuth()

  const [name, setName]     = useState(currentUser?.name ?? '')
  const [phone, setPhone]   = useState(currentUser?.phone ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [saved, setSaved]   = useState(false)

  const reputation   = currentUser ? getHirerReputation(currentUser.id) : 0
  const historyCount = currentUser ? getHireHistoryByHirer(currentUser.id).length : 0

  useEffect(() => {
    setName(currentUser?.name ?? '')
    setPhone(currentUser?.phone ?? '')
  }, [currentUser])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = {
      name:  validateName(name) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
    }
    setErrors(errs)
    if (errs.name || errs.phone) return

    if (currentUser) {
      updateUser({ ...currentUser, name: name.trim(), phone: phone.trim() })
      refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '0.35rem' }}>My Profile</h2>
      <p style={{ marginBottom: '2rem' }}>Manage your personal details and view your hiring reputation.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { icon: 'history', label: 'Total Hires', value: historyCount },
          { icon: 'star', label: 'Avg. Reputation', value: `${reputation} / 5` },
        ].map(stat => (
          <div
            key={stat.label}
            className="card"
            style={{ textAlign: 'center' }}
          >
            <div className="card-body">
              <span className="material-icons" style={{ fontSize: '2rem', color: 'var(--olive)', marginBottom: '0.5rem', display: 'block' }}>
                {stat.icon}
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h4>
            <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--charcoal)' }}>manage_accounts</span>
            Personal Information
          </h4>
        </div>
        <div className="card-body">
          {saved && (
            <div className="alert alert-success animate-fade">
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>check_circle</span>
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={currentUser?.email ?? ''}
                disabled
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
              />
              <span className="form-hint">Email cannot be changed after registration.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hirer-name" className="form-label">Full Name *</label>
                <input
                  id="hirer-name"
                  type="text"
                  className={`form-input${errors.name ? ' error' : ''}`}
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
                  placeholder="Your full name"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="hirer-phone" className="form-label">Phone Number *</label>
                <input
                  id="hirer-phone"
                  type="tel"
                  className={`form-input${errors.phone ? ' error' : ''}`}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })) }}
                  placeholder="04XX XXX XXX"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input type="text" className="form-input" value="Hirer (Event Organiser)" disabled
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Hiring Reputation</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                <StarRating value={Math.round(reputation)} readOnly size="lg" />
                <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{reputation.toFixed(1)} / 5.0</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  based on {historyCount} hire{historyCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              <span className="material-icons">save</span>
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
