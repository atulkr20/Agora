import { useState, useEffect, useRef, Suspense } from 'react'
import { gsap } from 'gsap'
import RubiksScene from './RubiksScene'
import './App.css'

export default function App() {
  const [page, setPage] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cardRef = useRef(null)
  const formRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // GSAP entrance animation
  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { y: 40, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }
    )
  }, [])

  // Animate form swap
  const switchPage = (p) => {
    if (!formRef.current) { setPage(p); return }
    gsap.to(formRef.current, {
      opacity: 0, y: 12, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        setPage(p)
        setError('')
        setForm({ name: '', email: '', password: '', confirm: '' })
        gsap.fromTo(formRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
        )
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (page === 'signup' && form.password !== form.confirm) {
      setError('Passwords do not match.')
      // shake the button
      gsap.to('#submit-btn', { x: [-6, 6, -5, 5, -3, 3, 0], duration: 0.4, ease: 'power2.out' })
      return
    }
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }

  return (
    <div className="pr-root">
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden="true" />

      <div className="pr-card" ref={cardRef}>

        {/* ─── LEFT: Voxel scene ───────────────────────────── */}
        <div className="pr-left">
          <div className="pr-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>AGORA</span>
          </div>

          <div className="pr-scene">
            <Suspense fallback={<div className="pr-scene-loader"><span>LOADING...</span></div>}>
              <RubiksScene />
            </Suspense>
          </div>

          <div className="pr-left-bottom">
            <div className="pr-ticker">
              <span className="pr-live-dot" />&nbsp;LIVE&nbsp;&nbsp;
              <span className="pr-green">BTC $96,241 ▲4.2%</span>
              &nbsp;&nbsp;<span className="pr-dim">|</span>&nbsp;&nbsp;
              <span className="pr-yellow">ETH $3,408 ▲1.8%</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Form ─────────────────────────────────── */}
        <div className="pr-right">
          <div className="pr-tab-row">
            <button
              className={`pr-tab${page === 'signin' ? ' active' : ''}`}
              onClick={() => switchPage('signin')}
              id="tab-signin"
            >
              SIGN IN
            </button>
            <button
              className={`pr-tab${page === 'signup' ? ' active' : ''}`}
              onClick={() => switchPage('signup')}
              id="tab-signup"
            >
              SIGN UP
            </button>
          </div>

          <div className="pr-form-wrap" ref={formRef}>
            <h1 className="pr-title">
              {page === 'signin' ? 'WELCOME\nBACK.' : 'CREATE\nACCOUNT.'}
            </h1>

            {/* OAuth */}
            <div className="pr-oauth">
              <button className="pr-oauth-btn" style={{ width: '100%' }} id="oauth-google" onClick={() => alert('Google')}>
                <svg viewBox="0 0 24 24" width="15" height="15">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <div className="pr-divider"><span>OR</span></div>

            <form className="pr-form" onSubmit={handleSubmit}>
              {page === 'signup' && (
                <div className="pr-field">
                  <label>NAME</label>
                  <input type="text" placeholder="Satoshi Nakamoto"
                    value={form.name} onChange={e => set('name', e.target.value)}
                    required id="input-name" autoComplete="name" />
                </div>
              )}

              <div className="pr-field">
                <label>EMAIL</label>
                <input type="email" placeholder="you@agora.exchange"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  required id="input-email" autoComplete="email" />
              </div>

              <div className="pr-field">
                <div className="pr-label-row">
                  <label>PASSWORD</label>
                  {page === 'signin' && (
                    <button type="button" className="pr-forgot" id="forgot-btn">FORGOT?</button>
                  )}
                </div>
                <input type="password" placeholder="••••••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  required id="input-password"
                  autoComplete={page === 'signin' ? 'current-password' : 'new-password'} />
              </div>

              {page === 'signup' && (
                <div className="pr-field">
                  <label>CONFIRM PASSWORD</label>
                  <input type="password" placeholder="••••••••••••"
                    value={form.confirm} onChange={e => set('confirm', e.target.value)}
                    required id="input-confirm" autoComplete="new-password" />
                </div>
              )}

              {error && <p className="pr-error">⚠ {error}</p>}

              <button type="submit" className="pr-submit" id="submit-btn" disabled={loading}>
                {loading
                  ? <span className="pr-spinner" />
                  : <>{page === 'signin' ? 'START TRADING' : 'CREATE ACCOUNT'} →</>
                }
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Bottom tagline */}
      <p className="pr-footer-text">© 2026 AGORA LABS · INSTITUTIONAL GRADE DEX · v2.0</p>
    </div>
  )
}
