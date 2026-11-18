import { Link, useNavigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell'
import { Back, Next } from '../components/icons'
import { useCaptures, useProfile } from '../lib/store'
import { MONTHS, dayKey, monthGrid, monthKey } from '../lib/dates'
import { useSwipe } from '../lib/gestures'
import { Missing } from './MonthView'

export default function YearView() {
  const { username, year: y } = useParams()
  const year = Number(y)
  const nav = useNavigate()
  const { person } = useProfile(username)
  const { captures } = useCaptures(person?.id, `${year}-01-01`, `${year}-12-31`)
  const today = dayKey()

  const counts = {}
  for (const c of captures) counts[c.day] = (counts[c.day] || 0) + 1
  const logged = Object.keys(counts).length

  const go = (n) => nav(`/u/${username}/y/${year + n}`, { replace: true })
  const swipe = useSwipe({ onLeft: () => go(1), onRight: () => go(-1) })
  const thisMonth = today.startsWith(String(year)) ? today.slice(0, 7) : monthKey(year, 0)

  if (person === null) return <Missing />

  return (
    <Shell
      left={<button className="icon-btn" onClick={() => nav(`/u/${username}/m/${thisMonth}`)} aria-label="Back to month"><Back /></button>}
      onCentre={() => nav('/')}
      centrePerson={person}
      centreLabel="Back to today"
    >
      <div className="year" {...swipe}>
        <div className="month-head">
          <button className="icon-btn small" onClick={() => go(-1)} aria-label="Previous year"><Back size={20} /></button>
          <h2>{year}</h2>
          <button className="icon-btn small" onClick={() => go(1)} aria-label="Next year"><Next size={20} /></button>
        </div>
        <p className="month-sub">{logged} {logged === 1 ? 'day' : 'days'} logged</p>
        <div className="months">
          {MONTHS.map((name, m) => (
            <Link key={m} to={`/u/${username}/m/${monthKey(year, m)}`} className="mini" style={{ '--n': m }}>
              <span className="mini-name">{name.slice(0, 3)}</span>
              <span className="mini-grid">
                {monthGrid(year, m).flat().map((k, i) => (
                  <i key={i} className={!k ? 'blank' : [counts[k] ? `lv${Math.min(3, Math.ceil(counts[k] / 3))}` : '', k === today ? 'today' : ''].join(' ')} />
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
