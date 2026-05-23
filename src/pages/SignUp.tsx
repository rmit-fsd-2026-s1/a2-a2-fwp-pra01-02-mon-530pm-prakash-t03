import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function SignUp() {
  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: 'calc(100vh - 180px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          background: 'linear-gradient(160deg, var(--bg-subtle) 0%, var(--bg) 60%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 500 }} className="animate-fade">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 60, height: 60,
                background: 'var(--olive)',
                borderRadius: 'var(--r-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <span className="material-icons" style={{ color: '#fff', fontSize: '1.75rem' }}>person_add</span>
            </div>
            <h2 style={{ marginBottom: '0.35rem' }}>Create Your Account</h2>
            <p>Join Venue Vendors — Melbourne's gold standard venue hiring platform</p>
          </div>

          <div className="card">
            <div className="card-body">
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--charcoal) 0%, var(--charcoal-light) 100%)',
                  borderRadius: 'var(--r)',
                  padding: '2rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--olive)', marginBottom: '0.75rem', display: 'block' }}>
                  construction
                </span>
                <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                  Registration Coming Soon
                </h3>
                <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Not yet implemented.
                </p>
              </div>

              <div className="alert alert-info">
                <span className="material-icons" style={{ fontSize: '1rem' }}>info</span>
                <div>
                  <strong>For demonstration purposes</strong>, please use one of the pre-seeded accounts:
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', fontSize: '0.875rem' }}>
                    <li><strong>Hirer:</strong> hirer@vv.com / Password1!</li>
                    <li><strong>Hirer 2:</strong> emma@vv.com / Password1!</li>
                    <li><strong>Hirer 3:</strong> david@vv.com / Password1!</li>
                    <li><strong>Vendor:</strong> vendor@vv.com / Password1!</li>
                    <li><strong>Vendor 2:</strong> sarah@vv.com / Password1!</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link to="/sign-in" className="btn btn-primary" style={{ flex: 1 }}>
                  <span className="material-icons">login</span>
                  Sign In Instead
                </Link>
                <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
                  <span className="material-icons">home</span>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Assignment 1 Prototype (Not yet implemented).
          </p>
        </div>
      </div>
    </>
  )
}
