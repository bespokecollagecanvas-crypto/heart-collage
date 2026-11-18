import { clock, dayKey, longDate } from '../lib/dates'
import { Pin } from './icons'

/** Date, time and place printed on the photo itself. */
export default function MetaOverlay({ at, place, children }) {
  const d = at instanceof Date ? at : new Date(at)
  return (
    <div className="meta-overlay">
      <div className="meta-time">{clock(d)}</div>
      <div className="meta-date">{longDate(dayKey(d))}</div>
      {place && <div className="meta-place"><Pin size={14} /> {place}</div>}
      {children}
    </div>
  )
}
