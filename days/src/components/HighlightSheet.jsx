import { useEffect, useRef, useState } from 'react'
import { useApp, useCaptures } from '../lib/store'
import { api } from '../lib/api'
import { addDays, dayKey, longDate } from '../lib/dates'
import { DAY_ICONS, DayIcon, suggestIcon } from './DayIcons'
import CaptureFace from './CaptureFace'
import { Close, Globe, Lock } from './icons'

/**
 * Ask for (or edit) a day's highlight: a few words and an optional icon.
 * The icon is suggested from the words until the person picks one themselves.
 */
export default function HighlightSheet({ day, initial, asking = false, onClose, onLater }) {
  const { profile, bump, setToast } = useApp()
  const { captures } = useCaptures(profile.id, day, day)
  const [text, setText] = useState(initial?.highlight || '')
  const [icon, setIcon] = useState(initial?.icon || null)
  const [picked, setPicked] = useState(!!initial?.icon)
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true)
  const [busy, setBusy] = useState(false)
  const input = useRef()

  useEffect(() => {
    if (!picked) setIcon(suggestIcon(text))
  }, [text, picked])

  const yesterday = day === addDays(dayKey(), -1)
  const title = asking ? 'What made yesterday what it was?' : 'The highlight of this day'

  async function save(clear = false) {
    setBusy(true)
    try {
      await api.days.set(day, clear ? {} : { highlight: text.trim(), icon, is_public: isPublic })
      bump()
      setToast(clear ? 'Highlight removed' : 'Highlight saved')
      onClose(true)
    } catch (e) {
      setToast(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={() => onClose(false)}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="eyebrow muted">{yesterday ? 'Yesterday · ' : ''}{longDate(day)}</span>
          <button className="icon-btn small" onClick={() => onClose(false)} aria-label="Close"><Close size={18} /></button>
        </div>
        <h2>{title}</h2>

        {captures.length > 0 && (
          <div className="sheet-strip">
            {captures.slice(0, 12).map((c) => (
              <span key={c.id} className="strip-item"><CaptureFace c={c} compact /></span>
            ))}
          </div>
        )}

        <div className="hl-input">
          {icon && <DayIcon name={icon} size={20} />}
          <input
            ref={input}
            id="highlight-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="In a few words…"
            maxLength={80}
            autoFocus={!asking}
          />
        </div>

        <div className="icon-grid" role="radiogroup" aria-label="Icon for this day">
          <button type="button" className={!icon ? 'on' : ''} onClick={() => { setIcon(null); setPicked(true) }} aria-label="No icon">
            <span className="none">–</span>
          </button>
          {DAY_ICONS.map((i) => (
            <button key={i.key} type="button" className={icon === i.key ? 'on' : ''} onClick={() => { setIcon(i.key); setPicked(true) }} aria-label={i.label} title={i.label}>
              <DayIcon name={i.key} size={18} />
            </button>
          ))}
        </div>

        <button type="button" className="hl-privacy" onClick={() => setIsPublic(!isPublic)}>
          {isPublic ? <Globe size={14} /> : <Lock size={14} />}
          {isPublic ? 'Public: shown on your calendar to others' : 'Private: only you see this highlight'}
        </button>

        <div className="sheet-actions">
          {asking ? (
            <button className="btn ghost" onClick={onLater} disabled={busy}>Later</button>
          ) : initial ? (
            <button className="btn ghost" onClick={() => save(true)} disabled={busy}>Remove</button>
          ) : (
            <button className="btn ghost" onClick={() => onClose(false)} disabled={busy}>Cancel</button>
          )}
          <button className="btn primary" onClick={() => save()} disabled={busy || (!text.trim() && !icon)}>Save highlight</button>
        </div>
        {asking && <button className="sheet-skip" onClick={() => onClose(false)}>Skip yesterday</button>}
      </div>
    </div>
  )
}
