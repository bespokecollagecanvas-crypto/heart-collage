import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Shell from '../components/Shell'
import MetaOverlay from '../components/MetaOverlay'
import { VoicePlayer } from '../components/Voice'
import { Back, Close, Next, Trash } from '../components/icons'
import { useApp, useCaptures, useProfile } from '../lib/store'
import { api } from '../lib/api'
import { addDays, clock, dayFraction, dayKey, longDate } from '../lib/dates'
import { usePinch, useSwipe } from '../lib/gestures'

// Open question in the brief: which capture sits at the front when a day opens.
// 'first' = the day reads from morning onwards. Change to 'last' to start from the most recent.
const START_AT = 'first'

export default function DayView() {
  const { username, day } = useParams()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { setToast, bump } = useApp()
  const { person, mine } = useProfile(username)
  const { captures, loading } = useCaptures(person?.id, day, day)
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const full = sp.get('full') === '1'
  const stageRef = useRef()
  const month = day.slice(0, 7)

  useEffect(() => {
    const want = Number(sp.get('i'))
    setIndex(Number.isFinite(want) && sp.has('i') ? want : START_AT === 'last' ? Math.max(0, captures.length - 1) : 0)
    setExpanded(false)
  }, [day, captures.length])

  usePinch(stageRef, { onPinchIn: () => (full ? setFull(false) : nav(`/u/${username}/m/${month}`)) })

  const setFull = (on) => {
    const next = new URLSearchParams(sp)
    if (on) next.set('full', '1')
    else next.delete('full')
    setSp(next, { replace: !on })
  }

  async function remove(c) {
    try {
      await api.captures.remove(c)
      setIndex(0)
      setFull(false)
      bump()
    } catch (e) {
      setToast(e.message)
    }
  }

  const places = [...new Set(captures.map((c) => c.place_name).filter(Boolean))]
  const isToday = day === dayKey()
  const future = day > dayKey()

  return (
    <Shell
      left={<Link className="icon-btn" to={`/u/${username}/m/${month}`} aria-label="Back to month"><Back /></Link>}
      right={!mine && person && <span className="who">@{person.username}</span>}
      onCentre={() => nav(`/u/${username}/m/${month}`)}
      centrePerson={person}
      centreLabel="Month view"
    >
      <div className="day" ref={stageRef}>
        {!full && (
          <div className="day-head">
            <Link className="icon-btn small" to={`/u/${username}/d/${addDays(day, -1)}`} replace aria-label="Previous day"><Back size={20} /></Link>
            <div className="day-title">
              <h2>{isToday ? 'Today' : longDate(day)}</h2>
              <p>
                {isToday && <>{longDate(day)} · </>}
                {captures.length ? `${captures.length} ${captures.length === 1 ? 'moment' : 'moments'}` : ''}
                {places.length ? ` · ${places.slice(0, 2).join(', ')}` : ''}
              </p>
            </div>
            <Link className={`icon-btn small ${future ? 'disabled' : ''}`} to={`/u/${username}/d/${addDays(day, 1)}`} replace aria-label="Next day"><Next size={20} /></Link>
          </div>
        )}

        {loading && !captures.length ? (
          <div className="empty"><div className="spinner" /></div>
        ) : !captures.length ? (
          <div className="empty">
            <p>{future ? 'This day hasn’t happened yet.' : mine ? 'Nothing logged on this day.' : `${person?.name || 'They'} logged nothing this day.`}</p>
            {mine && isToday && <button className="btn primary" onClick={() => nav('/')}>Capture something</button>}
          </div>
        ) : full ? (
          <FullView captures={captures} index={index} setIndex={setIndex} onClose={() => setFull(false)} onDelete={mine ? remove : null} />
        ) : expanded ? (
          <Spread captures={captures} index={index} onPick={(i) => { setIndex(i); setExpanded(false) }} />
        ) : (
          <FannedStack captures={captures} index={index} setIndex={setIndex} onTap={() => setExpanded(true)} onDoubleTap={() => setFull(true)} />
        )}

        {!full && captures.length > 0 && (
          <p className="day-hint">{expanded ? 'Tap a moment to bring it to the front' : 'Swipe through · tap to spread · double tap for full screen'}</p>
        )}
      </div>
    </Shell>
  )
}

/* ---------- The fanned stack ---------- */

const STEP_X = 7
const STEP_Y = 10
const TAB_W = 62
const MAX_DEPTH = 6

function FannedStack({ captures, index, setIndex, onTap, onDoubleTap }) {
  const ref = useRef()
  const [size, setSize] = useState(null)
  const [drag, setDrag] = useState(0)
  const g = useRef({ x: 0, y: 0, active: false, moved: false, lastTap: 0, timer: null })

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const n = captures.length
  const depthOf = (i) => (i - index + n) % n
  const go = (d) => setIndex((index + d + n) % n)

  const handlers = {
    onPointerDown(e) {
      g.current = { ...g.current, x: e.clientX, y: e.clientY, active: true, moved: false }
    },
    onPointerMove(e) {
      if (!g.current.active) return
      const dx = e.clientX - g.current.x
      if (Math.abs(dx) > 8) g.current.moved = true
      if (g.current.moved) setDrag(dx)
    },
    onPointerUp(e) {
      const s = g.current
      if (!s.active) return
      s.active = false
      const dx = e.clientX - s.x
      setDrag(0)
      if (s.moved) {
        if (Math.abs(dx) > 60 && n > 1) go(dx < 0 ? 1 : -1)
        return
      }
      const t = Date.now()
      if (t - s.lastTap < 300) {
        clearTimeout(s.timer)
        s.lastTap = 0
        onDoubleTap()
      } else {
        s.lastTap = t
        s.timer = setTimeout(onTap, 300)
      }
    },
    onPointerCancel() {
      g.current.active = false
      setDrag(0)
    },
  }
  useEffect(() => () => clearTimeout(g.current.timer), [])

  let layout = null
  if (size) {
    const depthMax = Math.min(n - 1, MAX_DEPTH)
    const cardW = Math.max(120, Math.min(size.w - TAB_W - 20 - depthMax * STEP_X, (size.h - 20 - depthMax * STEP_Y) * 0.75))
    const cardH = cardW * (4 / 3)
    const left = Math.max(6, (size.w - TAB_W - cardW - depthMax * STEP_X) / 2)
    const top = (size.h - cardH + depthMax * STEP_Y) / 2
    // Each tab sits at the height of its time of day, nudged apart so none overlap.
    const pad = 16
    const GAP = 25
    const items = captures
      .map((c, i) => ({ i, y: top + pad + dayFraction(new Date(c.taken_at)) * (cardH - pad * 2) }))
      .sort((a, b) => a.y - b.y)
    for (let k = 1; k < items.length; k++) items[k].y = Math.max(items[k].y, items[k - 1].y + GAP)
    const maxY = size.h - 14
    for (let k = items.length - 1; k >= 0; k--) {
      const limit = k === items.length - 1 ? maxY : items[k + 1].y - GAP
      items[k].y = Math.min(items[k].y, limit)
    }
    const tabY = {}
    items.forEach((it) => (tabY[it.i] = it.y))
    layout = { cardW, cardH, left, top, tabY }
  }

  return (
    <div className="stack" ref={ref} {...handlers}>
      {layout &&
        captures.map((c, i) => {
          const d = depthOf(i)
          const hidden = d > MAX_DEPTH
          const front = d === 0
          const x = layout.left + Math.min(d, MAX_DEPTH) * STEP_X + (front ? drag : 0)
          const y = layout.top - Math.min(d, MAX_DEPTH) * STEP_Y
          const rot = front ? drag / 25 : (d % 2 ? 1.2 : -0.8) * Math.min(d, 3) * 0.6
          return (
            <div
              key={c.id}
              className={`card ${front ? 'front' : ''} ${front && drag ? 'dragging' : ''}`}
              style={{
                width: layout.cardW, height: layout.cardH,
                transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                zIndex: 100 - d, opacity: hidden ? 0 : 1,
                '--shade': Math.min(d, MAX_DEPTH) * 0.07,
              }}
            >
              <CardMedia c={c} live={front} />
              {front && <div className="card-place">{c.place_name}</div>}
            </div>
          )
        })}
      {layout &&
        captures.map((c, i) => {
          const d = Math.min(depthOf(i), MAX_DEPTH)
          const lineFrom = layout.left + layout.cardW + d * STEP_X
          return (
            <button
              key={`t${c.id}`}
              className={`time-tab ${i === index ? 'on' : ''}`}
              style={{ left: lineFrom - 2, top: layout.tabY[i] - 11, zIndex: 200 }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => setIndex(i)}
            >
              <span className="line" />
              <span className="pill">{clock(new Date(c.taken_at))}</span>
            </button>
          )
        })}
    </div>
  )
}

function CardMedia({ c, live }) {
  if (c.type === 'video' && live)
    return <video src={c.media_url} poster={c.thumb_url || undefined} autoPlay muted loop playsInline />
  return <img src={live ? c.media_url : c.thumb_url || c.media_url} alt="" draggable={false} loading="lazy" />
}

/* ---------- Tap: spread the whole day out ---------- */

function Spread({ captures, index, onPick }) {
  return (
    <div className="spread">
      {captures.map((c, i) => (
        <button key={c.id} className={`spread-item ${i === index ? 'on' : ''}`} style={{ '--i': i }} onClick={() => onPick(i)}>
          <img src={c.thumb_url || c.media_url} alt="" />
          <span className="pill">{clock(new Date(c.taken_at))}</span>
          {c.type === 'video' && <span className="badge">▶</span>}
        </button>
      ))}
    </div>
  )
}

/* ---------- Double tap: full screen ---------- */

function FullView({ captures, index, setIndex, onClose, onDelete }) {
  const c = captures[index] || captures[0]
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  const n = captures.length
  const last = useRef(0)
  const swipe = useSwipe({
    onLeft: () => index < n - 1 && setIndex(index + 1),
    onRight: () => index > 0 && setIndex(index - 1),
  })
  const tap = () => {
    const t = Date.now()
    if (t - last.current < 300) onClose()
    last.current = t
  }
  return (
    <div className="full" {...swipe} onClick={tap}>
      <div className="full-bg" style={{ backgroundImage: `url(${c.thumb_url || c.media_url})` }} />
      {c.type === 'video' ? (
        <video key={c.id} className="full-media" src={c.media_url} autoPlay loop playsInline controls />
      ) : (
        <img key={c.id} className="full-media" src={c.media_url} alt="" />
      )}
      <div className="full-top">
        <span className="count-chip">{index + 1} / {n}</span>
        <div className="row">
          {onDelete && (
            <button className={`icon-btn glass ${armed ? 'armed' : ''}`} onClick={(e) => { e.stopPropagation(); armed ? onDelete(c) : setArmed(true) }} aria-label={armed ? 'Tap again to delete' : 'Delete'}>
              {armed ? <span className="armed-label">Delete?</span> : <Trash />}
            </button>
          )}
          <button className="icon-btn glass" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Close"><Close /></button>
        </div>
      </div>
      <MetaOverlay at={c.taken_at} place={c.place_name}>
        {c.comment && <p className="meta-comment">{c.comment}</p>}
        {c.voice_note_url && <VoicePlayer src={c.voice_note_url} />}
      </MetaOverlay>
      <div className="dots">{captures.map((x, i) => <span key={x.id} className={i === index ? 'on' : ''} />)}</div>
    </div>
  )
}
