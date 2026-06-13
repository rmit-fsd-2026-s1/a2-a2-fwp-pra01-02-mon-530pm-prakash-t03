/**
 * VENUE VENDORS CLIENT APP - HIRERPROFILE.TSX
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
import { updateUser } from '../../utils/storage'
import { validateName, validatePhone } from '../../utils/validation'
import StarRating from '../../components/StarRating'
import { api } from '../../utils/api'

export default function HirerProfile() {
  const { currentUser, refreshUser } = useAuth()

  const [name, setName]     = useState(currentUser?.name ?? '')
  const [phone, setPhone]   = useState(currentUser?.phone ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; avatar?: string; submit?: string }>({})
  const [saved, setSaved]   = useState(false)

  // Avatar states for file preview and raw base64 data
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl ?? '')
  const [avatarData, setAvatarData] = useState(currentUser?.avatarUrl ?? '')

  const [reputation, setReputation] = useState<number>(0)
  const [historyCount, setHistoryCount] = useState<number>(0)

  useEffect(() => {
    if (!currentUser) return
    api.getHistoryByHirer(currentUser.id)
      .then(res => {
        setReputation(res.reputation || 0)
        setHistoryCount(res.historyCount || 0)
      })
      .catch(err => {
        console.error('Failed to fetch reputation stats:', err)
      })
  }, [currentUser])

  useEffect(() => {
    setName(currentUser?.name ?? '')
    setPhone(currentUser?.phone ?? '')
    setAvatarPreview(currentUser?.avatarUrl ?? '')
    setAvatarData(currentUser?.avatarUrl ?? '')
  }, [currentUser])

  /**
   * POSTGRADUATE REQUIREMENT IMPLEMENTATION EXPLANATION:
   * 1. Profile avatar is uploaded as a file from the user's local file input.
   * 2. The selected file is validated for size (<2MB) and type (JPG/PNG).
   * 3. The file is read and converted to a base64 encoded string using the web FileReader API.
   * 4. This base64 string is saved to local React state (`avatarPreview` / `avatarData`) to display a preview instantly.
   * 5. When the user clicks "Save Changes", the base64 string payload is sent to `/api/auth/profile` via `api.updateProfile`.
   * 6. The backend saves the base64 string directly in the user's `avatarUrl` column in the MySQL database.
   */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, avatar: 'Avatar image must be smaller than 2MB.' }))
      return
    }

    const allowed = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setErrors(p => ({ ...p, avatar: 'Only JPG, JPEG, or PNG images are accepted.' }))
      return
    }

    setErrors(p => ({ ...p, avatar: undefined }))

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setAvatarPreview(base64)
      setAvatarData(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = {
      name:  validateName(name) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
    }
    setErrors(errs)
    if (errs.name || errs.phone) return

    if (currentUser) {
      try {
        await api.updateProfile(name.trim(), phone.trim(), avatarData || undefined)
        // Sync local storage in case offline fallback uses it
        updateUser({ ...currentUser, name: name.trim(), phone: phone.trim(), avatarUrl: avatarData })
        await refreshUser()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err: any) {
        console.error(err)
        setErrors(p => ({ ...p, submit: err.message || 'Failed to update profile.' }))
      }
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

          {errors.submit && (
            <div className="alert alert-error animate-fade">
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>error</span>
              {errors.submit}
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

            {/* Profile Avatar Upload / Preview */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Profile Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--olive)',
                    flexShrink: 0,
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="material-icons" style={{ fontSize: '2.5rem', color: '#94a3b8' }}>person</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleAvatarChange}
                    className="form-input"
                    style={{ padding: '0.4rem 0.6rem' }}
                  />
                  {errors.avatar && <span className="form-error" style={{ display: 'block', marginTop: '0.25rem' }}>{errors.avatar}</span>}
                  <span className="form-hint" style={{ display: 'block', marginTop: '0.25rem' }}>Accepted formats: JPG, JPEG, PNG. Max size: 2MB.</span>
                </div>
              </div>
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
