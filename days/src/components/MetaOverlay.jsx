import { clock, dayKey, longDate } from '../lib/dates'
import { Pin } from './icons'

const coord = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`

/** Date, time and place printed on the capture itself, like a camera's data imprint. */
export default function MetaOverlay({ at, place, lat, lng, children }) {
  const d = at instanceof Date ? at : new Date(at)
  return (
    <div className="meta-overlay">
      <div className="meta-time">{clock(d)}</div>
      <div className="meta-date">{longDate(dayKey(d))}</div>
      {place && <div className="meta-place"><Pin size={13} /> {place}</div>}
      {lat != null && lng != null && <div className="meta-coord">{coord(lat, 'N', 'S')} · {coord(lng, 'E', 'W')}</div>}
      {children}
    </div>
  )
}
