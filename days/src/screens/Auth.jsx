import { useState } from 'react'
import { api } from '../lib/api'

export default function Auth() {
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const demo = api.mode === 'local'
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signup') {
        const r = await api.auth.signUp(form)
        if (r.needsConfirm) setMsg({ ok: true, text: 'Check your email for a link to confirm your account, then log in.' })
      } else {
        await api.auth.signIn(form)
      }
    } catch (err) {
      setMsg({ text: err.message })
    }
    setBusy(false)
  }

  async function social(p) {
    setMsg(null)
    try {
      await api.auth.signInWithProvider(p)
    } catch (err) {
      setMsg({ text: err.message })
    }
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <h1 className="wordmark big">Days</h1>
        <p className="tagline">Never forget a day.</p>
        <div className="hero-grid" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => <span key={i} className={`hg ${[2, 3, 5, 8, 9, 10, 12, 15, 16, 17, 19, 22, 23].includes(i) ? 'on' : ''} ${i === 24 ? 'today' : ''}`} />)}
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="seg">
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
        </div>
        {mode === 'signup' && (
          <label>Name<input required autoComplete="name" value={form.name} onChange={set('name')} placeholder="Your name" /></label>
        )}
        <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} placeholder="At least 6 characters" /></label>
        {msg && <p className={`note ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Start my Days' : 'Log in'}</button>
        <div className="or"><span>or</span></div>
        <button type="button" className="btn social" onClick={() => social('google')}>Continue with Google</button>
        <button type="button" className="btn social" onClick={() => social('facebook')}>Continue with Facebook</button>
        {demo && <p className="note">Demo mode: your account and photos are saved on this phone only.</p>}
      </form>
    </div>
  )
}
