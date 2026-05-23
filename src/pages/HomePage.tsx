import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

const FEATURES = [
  {
    icon: 'search',
    title: 'Discover Venues',
    desc: 'Browse Melbourne\'s best event spaces, from rooftop terraces to grand ballrooms - filtered by location, capacity, and event type.',
  },
  {
    icon: 'description',
    title: 'Easy Applications',
    desc: 'Submit detailed event applications with all your requirements. Upload compliance documents to build your credibility profile.',
  },
  {
    icon: 'verified',
    title: 'Trusted Network',
    desc: 'Vendors review applicant history, reputation scores, and compliance documents before approving bookings for complete peace of mind.',
  },
  {
    icon: 'star',
    title: 'Reputation System',
    desc: 'Hirers build a hire history rated by vendors. A strong reputation score opens doors to premium venues faster.',
  },
]

const VENUES_PREVIEW = [
  {
    name: 'Aurora Central Ballroom',
    location: 'Melbourne CBD',
    capacity: 460,
    type: 'Formal Dinners',
    img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop',
    price: '$790/hr',
  },
  {
    name: 'Riverlight Terrace Hall',
    location: 'Southbank',
    capacity: 170,
    type: 'Networking Nights',
    img: 'https://plus.unsplash.com/premium_photo-1675970835634-12d69090e7d5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: '$485/hr',
  },
  {
    name: 'Fitzroy Assembly Rooms',
    location: 'Fitzroy',
    capacity: 280,
    type: 'Launch Events',
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop',
    price: '$640/hr',
  },
]

const STATS = [
  { value: '50+', label: 'Premium Venues' },
  { value: '1,200+', label: 'Events Hosted' },
  { value: '99%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Platform Access' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #111110 0%, #1C1C1A 55%, #2e2e2b 100%)',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(92,107,69,.2) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-20%', left: '-8%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(92,107,69,.12) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(92,107,69,.2)', borderRadius: 999,
                padding: '0.4rem 1rem', marginBottom: '1.5rem',
                color: '#8da06b', fontSize: '0.85rem', fontWeight: 600,
                border: '1px solid rgba(92,107,69,.3)',
              }}
            >
              <span className="material-icons" style={{ fontSize: '1rem' }}>place</span>
              Based in Melbourne, Victoria
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                color: '#fff',
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                lineHeight: 1.15,
                marginBottom: '1.5rem',
              }}
            >
              Find the Perfect Venue for{' '}
              <em style={{ color: 'var(--olive)', fontStyle: 'italic' }}>Every Event</em>
            </h1>

            <p
              style={{
                color: 'rgba(255,255,255,.78)',
                fontSize: '1.15rem',
                lineHeight: 1.75,
                marginBottom: '2.5rem',
                maxWidth: 560,
              }}
            >
              Venue Vendors connects Melbourne's event organisers with the spaces you want. 
              Browse curated venues, submit applications, and get them approved.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/sign-up" className="btn btn-accent btn-lg">
                <span className="material-icons">person_add</span>
                Get Started
              </Link>
              <Link to="/sign-in" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
                <span className="material-icons">login</span>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#5C6B45', padding: '1.5rem 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '0.85rem', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured venues */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>Featured Venues</h2>
            <p style={{ marginTop: '0.75rem', fontSize: '1.05rem' }}>
              A selection of Melbourne's most sought-after event spaces
            </p>
          </div>

          <div className="venue-grid">
            {VENUES_PREVIEW.map(v => (
              <div key={v.name} className="venue-card">
                <img src={v.img} alt={v.name} className="venue-card-img" />
                <div className="venue-card-body">
                  <div className="venue-card-name">{v.name}</div>
                  <div className="venue-card-location">
                    <span className="material-icons" style={{ fontSize: '0.9rem' }}>place</span>
                    {v.location}
                  </div>
                  <div className="venue-card-tags">
                    <span className="venue-tag">{v.type}</span>
                    <span className="venue-tag">Up to {v.capacity} guests</span>
                  </div>
                  <div className="venue-card-meta">
                    <span className="venue-capacity">
                      <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>group</span>{' '}
                      {v.capacity} pax
                    </span>
                    <span className="venue-price">{v.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center" style={{ marginTop: '2.5rem' }}>
            <Link to="/sign-in" className="btn btn-outline btn-lg">
              <span className="material-icons">explore</span>
              Browse All Venues
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>Why Venue Vendors?</h2>
            <p style={{ marginTop: '0.75rem', fontSize: '1.05rem' }}>
              Built for Melbourne's events industry — by people who understand it
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {FEATURES.map(f => (
              <div
                key={f.title}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--r-lg)',
                  padding: '2rem',
                  border: '1px solid var(--border)',
                  transition: 'transform var(--t), box-shadow var(--t)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = ''
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                }}
              >
                <div
                  style={{
                    width: 52, height: 52,
                    background: 'rgba(15,43,91,.08)',
                    borderRadius: 'var(--r)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <span className="material-icons" style={{ color: 'var(--charcoal)', fontSize: '1.6rem' }}>
                    {f.icon}
                  </span>
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{f.title}</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>How It Works</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up as a hirer or a venue vendor in under 2 minutes.' },
              { step: '02', title: 'Browse Venues', desc: 'Search and rank venues by location, capacity, and event type.' },
              { step: '03', title: 'Apply', desc: 'Submit your event application with all required details and documents.' },
              { step: '04', title: 'Get Approved', desc: 'Vendors review your profile and confirm the booking directly through the platform.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: 'var(--olive)',
                    lineHeight: 1,
                    marginBottom: '0.75rem',
                  }}
                >
                  {s.step}
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{s.title}</h4>
                <p style={{ fontSize: '0.9rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1C1C1A 0%, #2e2e2b 100%)',
          padding: '4rem 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>
            Ready to Find Your Perfect Venue?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.75)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Join hundreds of event organisers in Melbourne, who trust Venue Vendors.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/sign-up" className="btn btn-accent btn-lg">
              Register as a Hirer
            </Link>
            <Link to="/sign-up" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
              List Your Venue
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}