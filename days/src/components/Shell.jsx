import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { dayKey } from '../lib/dates'
import { Mic, Pen, People, Stack } from './icons'
import Avatar from './Avatar'

/**
 * Every screen sits between two permanent bars:
 *  top:    [left]            [profile button, dead centre]   [right]
 *  bottom: [pen] [mic]       [capture button, centre]        [today's stack] [people]
 */
export default function Shell({ left, right, onCentre, centreLabel = 'Zoom out', centrePerson, shutter, onPen, onMic, active, children, stageClass = '' }) {
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
        <div className="slot left tools">
          <button className={`tool ${active === 'note' ? 'on' : ''}`} onClick={onPen || (() => nav('/?new=note'))} aria-label="Write or draw a note">
            <Pen size={20} />
          </button>
          <button className={`tool ${active === 'voice' ? 'on' : ''}`} onClick={onMic || (() => nav('/?new=voice'))} aria-label="Record a voice note">
            <Mic size={20} />
          </button>
        </div>
        {shutter || (
          <button className="shutter" onClick={() => nav('/')} aria-label="Camera">
            <span />
          </button>
        )}
        <div className="slot right tools">
          <Link className="tool" to={`/u/${me}/d/${dayKey()}`} aria-label="Today's stack">
            <Stack size={20} />
          </Link>
          <Link className="tool" to="/people" aria-label="People">
            <People size={20} />
          </Link>
        </div>
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
