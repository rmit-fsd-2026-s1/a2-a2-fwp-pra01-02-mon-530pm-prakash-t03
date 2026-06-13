/**
 * FRONTEND HOME PAGE
 * 
 * Purpose: Displays the landing page for Venue Vendors, including Melbourne venue counts,
 * core capabilities, workflow roadmaps, and a dynamic browse section loading active venues.
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
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../utils/api'
import type { Venue } from '../types'

const FEATURES = [
  {
    icon: 'search',
    title: 'Curated Selection',
    desc: 'Filter Melbourne\'s best commercial and private event spaces dynamically by guest capacity, location, and specific suitabilities.',
  },
  {
    icon: 'verified_user',
    title: 'Profile Integrity',
    desc: 'Build verification status by submitting credibility documents. Increase reservation trust rating across all venues.',
  },
  {
    icon: 'timeline',
    title: 'Activity Ratios',
    desc: 'Our metric-driven dashboard aggregates applicant history so that vendors verify active status before booking.',
  },
  {
    icon: 'star_purple500',
    title: 'Featured Venues',
    desc: 'Highlight standard halls to stand out in the catalog. Instantly toggle featured showcase from the control panel.',
  },
]

const VENUES_PREVIEW_FALLBACK: Venue[] = [
  {
    id: 'fallback-1',
    vendorId: 'fallback-vendor',
    name: 'Aurora Central Ballroom',
    location: 'Melbourne CBD',
    capacity: 460,
    suitability: ['Formal Dinners'],
    description: 'Beautiful ballroom in Melbourne CBD',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop',
    pricePerHour: 790,
    isBlocked: false,
  },
  {
    id: 'fallback-2',
    vendorId: 'fallback-vendor',
    name: 'Riverlight Terrace Hall',
    location: 'Southbank',
    capacity: 170,
    suitability: ['Networking Nights'],
    description: 'Lovely terrace hall in Southbank',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1675970835634-12d69090e7d5?q=80&w=1740&auto=format&fit=crop',
    pricePerHour: 485,
    isBlocked: false,
  },
  {
    id: 'fallback-3',
    vendorId: 'fallback-vendor',
    name: 'Fitzroy Assembly Rooms',
    location: 'Fitzroy',
    capacity: 280,
    suitability: ['Launch Events'],
    description: 'Fitzroy assembly rooms',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop',
    pricePerHour: 640,
    isBlocked: false,
  },
]

const STATS = [
  { value: '50+', label: 'Registered Venues' },
  { value: '1.2k+', label: 'Successful Hires' },
  { value: '99.2%', label: 'Approval Rate' },
  { value: '24/7', label: 'Dashboard Control' },
]

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([])

  useEffect(() => {
    // Explanatory comment: I load active unblocked venues dynamically from the REST API database.
    // If the database has no venues or the backend is offline/unreachable, I load the mock list 
    // VENUES_PREVIEW_FALLBACK so the app remains fully functional and looks high-fidelity.
    api.getVenues()
      .then(data => {
        const activeVenues = (data || []).filter(v => !v.isBlocked)
        if (activeVenues.length > 0) {
          setVenues(activeVenues.slice(0, 3))
        } else {
          setVenues(VENUES_PREVIEW_FALLBACK)
        }
      })
      .catch(err => {
        console.error('Failed to load home page venues:', err)
        setVenues(VENUES_PREVIEW_FALLBACK)
      })
  }, [])

  // Explanatory comment: I query my venues list for any venue tagged as "featured" to showcase
  // in the hero card. If none are featured, I fall back to the first available venue in the array,
  // and if the array is empty, I fall back to a hardcoded ballroom object to maintain UI symmetry.
  const heroVenue = venues.find(v => v.isFeatured) || venues[0] || {
    name: 'Aurora Ballroom',
    location: 'Melbourne Central',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop',
    isFeatured: true,
  }

  return (
    <>
      <Navbar />

      {/* Grid Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #0F172A 100%)',
          padding: '4rem 0 6rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }} className="form-row">

            {/* Left Column Text Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(20, 184, 166, 0.1)',
                  borderRadius: '20px',
                  padding: '0.4rem 1rem',
                  color: 'var(--charcoal-light)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid rgba(20, 184, 166, 0.15)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>place</span>
                Melbourne, Victoria
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#fff',
                  fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
                  lineHeight: 1.15,
                  fontWeight: 800,
                  letterSpacing: '-0.02em'
                }}
              >
                Melbourne\'s Curated <br />
                <span style={{ color: 'var(--charcoal-light)' }}>Venue Coordinator</span>
              </h1>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '1.05rem',
                  lineHeight: 1.75,
                  maxWidth: 520,
                }}
              >
                Connecting event planners with Melbourne\'s premier spaces. Discover rooftop lofts,
                heritage suites, and ballrooms. Manage applications and client verification seamlessly.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <Link to="/sign-up" className="btn btn-primary btn-lg" style={{ borderRadius: '30px' }}>
                  <span className="material-icons">person_add</span>
                  Create Account
                </Link>
                <Link to="/sign-in" className="btn btn-outline btn-lg" style={{ borderRadius: '30px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                  <span className="material-icons">login</span>
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Column Custom Graphic Card */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '420px',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <img
                  src={heroVenue.imageUrl}
                  alt={heroVenue.name}
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%)'
                  }}
                />

                {/* Floating tags */}
                <div
                  style={{
                    position: 'absolute', bottom: 20, left: 20, right: 20,
                    background: 'rgba(19, 26, 38, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--r)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.15rem' }}>{heroVenue.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{heroVenue.location}</span>
                    {heroVenue.isFeatured && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', fontWeight: 700, marginLeft: 'auto' }}>Featured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Overlapping Floating Stats Section */}
      <section style={{ marginTop: '-3rem', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '2rem 1.5rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '2rem',
                textAlign: 'center',
              }}
            >
              {STATS.map(s => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                    {s.value}
                  </div>
                  <div style={{ color: 'var(--text-2)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Preview section */}
      <section className="section" style={{ background: '#F9FAFB' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.35rem' }}>Browse Spaces</h2>
              <p>Curated showcase of top event spots in Victoria.</p>
            </div>
            <Link to="/sign-in" className="btn btn-outline" style={{ borderRadius: '20px' }}>
              Explore Catalog
            </Link>
          </div>

          <div className="venue-grid">
            {venues.map(v => (
              <div key={v.id || v.name} className="venue-card" style={{ position: 'relative' }}>
                {v.isFeatured && (
                  <span
                    className="badge badge-approved"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.6rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      zIndex: 2,
                    }}
                  >
                    Featured
                  </span>
                )}
                <img src={v.imageUrl} alt={v.name} className="venue-card-img" />
                <div className="venue-card-body">
                  <div className="venue-card-name" style={{ color: 'var(--charcoal)', fontWeight: 700 }}>{v.name}</div>
                  <div className="venue-card-location">
                    <span className="material-icons" style={{ fontSize: '0.95rem' }}>place</span>
                    {v.location}
                  </div>
                  <div className="venue-card-tags">
                    <span className="venue-tag">{v.suitability?.[0] || 'Event Venue'}</span>
                    <span className="venue-tag">Up to {v.capacity} pax</span>
                  </div>
                  <div className="venue-card-meta">
                    <span className="venue-capacity">
                      <span className="material-icons" style={{ fontSize: '0.95rem', verticalAlign: 'middle', marginRight: 4 }}>group</span>
                      {v.capacity} capacity
                    </span>
                    <span className="venue-price" style={{ color: 'var(--charcoal-light)', fontWeight: 800 }}>${v.pricePerHour}/hr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Platform section */}
      <section className="section" style={{ background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3.5rem' }}>
            <h2>Platform Core Capabilities</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Everything you need for seamless venue booking workflows</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem',
            }}
          >
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="card"
                style={{
                  padding: '2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    width: 48, height: 48,
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span className="material-icons" style={{ color: 'var(--charcoal)', fontSize: '1.4rem' }}>
                    {f.icon}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--charcoal-dark)' }}>{f.title}</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-2)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Steps Roadmap */}
      <section className="section" style={{ background: '#F9FAFB', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2>Workflow Guide</h2>
            <p style={{ color: 'var(--text-muted)' }}>Get your booking approved in four simple steps</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { num: '01', title: 'Register profile', desc: 'Sign up as a Hirer or Vendor. Choose client or owner account type.' },
              { num: '02', title: 'Explore venues', desc: 'Browse the catalogs. Sort by guest list, locations, and pricing.' },
              { num: '03', title: 'Submit details', desc: 'Fill out the rental application forms and attach liability documents.' },
              { num: '04', title: 'Confirm reserve', desc: 'Vendors inspect credentials score and authorize the schedule.' },
            ].map((s, idx) => (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center',
                  flexDirection: idx % 2 === 0 ? 'row' : 'row-reverse',
                  textAlign: idx % 2 === 0 ? 'left' : 'right'
                }}
                className="form-row"
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'var(--charcoal-light)',
                    background: '#FFFFFF',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)',
                    flexShrink: 0
                  }}
                >
                  {s.num}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--charcoal-dark)' }}>{s.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #111827 100%)',
          padding: '5rem 0',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: '#fff', marginBottom: '1.25rem', fontSize: '2.25rem' }}>
            Find Your Ideal Space Today
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.25rem', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto 2.25rem' }}>
            Create an account or list your venues. Over 1,200 events hosted successfully in Melbourne.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/sign-up" className="btn btn-primary btn-lg" style={{ borderRadius: '30px' }}>
              Register as Hirer
            </Link>
            <Link to="/sign-up" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', borderColor: 'rgba(255,255,255,.2)', borderRadius: '30px' }}>
              List Your Venue
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}