import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { dayKey } from '../lib/dates'
import { People, Stack } from './icons'
import Avatar from './Avatar'

/**
 * Every screen sits between two permanent bars:
 *  top: [left] [profile button, dead centre] [right]
 *  bottom: [today's stack] [capture button, centre] [people]
 */
export default function Shell({ left, right, onCentre, centreLabel = 'Zoom out', centrePerson, shutter, children, stageClass = '' }) {
  const { profile, toast } = useApp()
  const nav = useNavigate()
  const me = profile?.username
  return (
    <div className="shell">
      <header className="bar top">
        <div className="slot left">{left}</div>
        <button className="profile-btn" onClick={onCentre} aria-label={centreLabel}>
          <Avatar person={centrePerson || profile} />
        </button>
        <div className="slot right">{right}</div>
      </header>
      <main className={`stage ${stageClass}`}>{children}</main>
      <footer className="bar bottom">
        <div className="slot left">
          <Link className="icon-btn" to={`/u/${me}/d/${dayKey()}`} aria-label="Today's stack">
            <Stack />
          </Link>
        </div>
        {shutter || (
          <button className="shutter" onClick={() => nav('/')} aria-label="Capture">
            <span />
          </button>
        )}
        <div className="slot right">
          <Link className="icon-btn" to="/people" aria-label="People">
            <People />
          </Link>
        </div>
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
