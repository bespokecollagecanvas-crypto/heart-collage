import { useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell'
import PersonHeader from '../components/PersonHeader'
import CaptureFace from '../components/CaptureFace'
import { Back, Flame, Gear, Next } from '../components/icons'
import { useApp, useCaptures, useProfile } from '../lib/store'
import { MONTHS, WEEKDAY_INITIALS, dayKey, monthGrid, monthRange, parseMonth, shiftMonth } from '../lib/dates'
import { usePinch, useSwipe } from '../lib/gestures'

export default function MonthView() {
  const { username, ym } = useParams()
  const nav = useNavigate()
  const { streak } = useApp()
  const { person, mine } = useProfile(username)
  const { year, month } = parseMonth(ym)
  const { from, to } = monthRange(year, month)
  const { captures } = useCaptures(person?.id, from, to)
  const ref = useRef()
  const today = dayKey()

  // Front of each day's stack = the first capture of the day.
  const byDay = {}
  for (const c of captures) (byDay[c.day] ||= []).push(c)
  const logged = Object.keys(byDay).length

  const go = (n) => nav(`/u/${username}/m/${shiftMonth(ym, n)}`, { replace: true })
  const swipe = useSwipe({ onLeft: () => go(1), onRight: () => go(-1) })
  usePinch(ref, { onPinchIn: () => nav(`/u/${username}/y/${year}`) })

  if (person === null) return <Missing />

  return (
    <Shell
      left={mine ? <Link className="icon-btn" to="/settings" aria-label="Settings"><Gear /></Link> : <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><Back /></button>}
      right={mine && <span className="streak"><Flame size={18} /> {streak}</span>}
      onCentre={() => nav(`/u/${username}/y/${year}`)}
      centrePerson={person}
      centreLabel="Year view"
    >
      <div className="month" ref={ref} {...swipe}>
        {!mine && person && <PersonHeader person={person} />}
        <div className="month-head">
          <button className="icon-btn small" onClick={() => go(-1)} aria-label="Previous month"><Back size={20} /></button>
          <h2>
            <Link to={`/u/${username}/y/${year}`}>{MONTHS[month]} <span>{year}</span></Link>
          </h2>
          <button className="icon-btn small" onClick={() => go(1)} aria-label="Next month"><Next size={20} /></button>
        </div>
        <p className="month-sub">
          {logged ? `${logged} ${logged === 1 ? 'day' : 'days'} logged` : 'No days logged yet'}
          {mine && streak > 0 && ` · ${streak}-day streak`}
        </p>
        <div className="weekdays">{WEEKDAY_INITIALS.map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="grid">
          {monthGrid(year, month).flat().map((k, i) => {
            if (!k) return <span key={i} className="cell blank" />
            const list = byDay[k]
            const top = list?.[0]
            const cls = ['cell', k === today && 'today', k > today && 'future', top && 'has', top && `type-${top.type}`].filter(Boolean).join(' ')
            return (
              <Link key={k} to={`/u/${username}/d/${k}`} className={cls} style={{ '--n': i }}>
                {top && <CaptureFace c={top} compact />}
                <span className="num">{Number(k.slice(8))}</span>
                {list?.length > 1 && <span className="more">{list.length}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </Shell>
  )
}

export function Missing() {
  return (
    <Shell onCentre={() => history.back()}>
      <div className="empty"><p>We couldn’t find that person.</p><Link className="btn primary" to="/people">Find people</Link></div>
    </Shell>
  )
}
