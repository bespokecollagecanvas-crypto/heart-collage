import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { Back, Check } from '../components/icons'
import { useApp } from '../lib/store'
import { api } from '../lib/api'

export default function Settings() {
  const { profile, updateProfile, streak, setToast, theme } = useApp()
  const nav = useNavigate()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)

  const step = (key, d, lo, hi) => updateProfile({ [key]: Math.max(lo, Math.min(hi, (profile[key] ?? 0) + d)) })

  async function saveNames(e) {
    e.preventDefault()
    const u = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!u) return setToast('Choose a username')
    await updateProfile({ name: name.trim(), username: u })
    setUsername(u)
    setToast('Saved')
  }

  return (
    <Shell
      left={<button className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><Back /></button>}
      onCentre={() => nav(`/u/${profile.username}`)}
      centreLabel="My calendar"
    >
      <div className="page">
        <h2>Settings</h2>

        <h3>Look</h3>
        <div className="themes">
          {[
            ['stone', 'Stone', 'Light plaster and graphite'],
            ['graphite', 'Graphite', 'Dark, matte and quiet'],
          ].map(([id, label, sub]) => (
            <button key={id} className={`theme-card ${id} ${theme === id ? 'on' : ''}`} onClick={() => updateProfile({ theme: id })}>
              <span className="swatches"><i /><i /><i /></span>
              <strong>{label}</strong>
              <span>{sub}</span>
              {theme === id && <Check className="tick" size={18} />}
            </button>
          ))}
        </div>

        <h3>Daily rules</h3>
        <div className="rule">
          <div><strong>Minimum</strong><span>Captures that count a day as logged</span></div>
          <div className="stepper"><button onClick={() => step('daily_min', -1, 1, profile.daily_max)}>−</button><b>{profile.daily_min}</b><button onClick={() => step('daily_min', 1, 1, profile.daily_max)}>+</button></div>
        </div>
        <div className="rule">
          <div><strong>Maximum</strong><span>So every photo counts</span></div>
          <div className="stepper"><button onClick={() => step('daily_max', -1, Math.max(1, profile.daily_min), 50)}>−</button><b>{profile.daily_max}</b><button onClick={() => step('daily_max', 1, 1, 50)}>+</button></div>
        </div>
        <p className="note">Current streak: {streak} {streak === 1 ? 'day' : 'days'} in a row.</p>

        <h3>Profile</h3>
        <form className="stack-form" onSubmit={saveNames}>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="off" /></label>
          <button className="btn primary">Save profile</button>
        </form>

        <h3>Account</h3>
        <p className="note">
          {api.mode === 'local'
            ? 'Demo mode: everything is saved on this phone only. Connect Supabase to get real accounts (see SETUP.md).'
            : `Signed in as ${profile.name}.`}
        </p>
        <button className="btn ghost" onClick={() => api.auth.signOut()}>Log out</button>
      </div>
    </Shell>
  )
}
