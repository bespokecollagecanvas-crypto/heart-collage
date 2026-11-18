import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Shell from '../components/Shell'
import Avatar from '../components/Avatar'
import { Back, Search } from '../components/icons'
import { useApp } from '../lib/store'
import { api } from '../lib/api'

export default function People() {
  const { profile } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [following, setFollowing] = useState([])

  useEffect(() => {
    api.follows.following().then(setFollowing).catch(() => {})
  }, [])
  useEffect(() => {
    const t = setTimeout(() => api.profiles.search(q).then((r) => setResults(r.filter((p) => p.id !== profile.id))).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q])

  const list = (people) =>
    people.map((p) => (
      <Link key={p.id} className="person" to={`/u/${p.username}`}>
        <Avatar person={p} size={42} />
        <div><strong>{p.name}</strong><span>@{p.username}</span></div>
      </Link>
    ))

  return (
    <Shell
      left={<button className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><Back /></button>}
      onCentre={() => nav(`/u/${profile.username}`)}
      centreLabel="My calendar"
    >
      <div className="page">
        <h2>People</h2>
        {api.mode === 'local' ? (
          <p className="note">Friends and following switch on once Days is connected to Supabase. In demo mode it’s just you.</p>
        ) : (
          <>
            <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or @username" /></label>
            {!q && following.length > 0 && <><h3>Following</h3>{list(following)}</>}
            <h3>{q ? 'Results' : 'Everyone on Days'}</h3>
            {results.length ? list(results) : <p className="note">No one found.</p>}
          </>
        )}
      </div>
    </Shell>
  )
}
