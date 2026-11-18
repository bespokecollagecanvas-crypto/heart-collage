import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Shell from '../components/Shell'
import MetaOverlay from '../components/MetaOverlay'
import { VoicePlayer } from '../components/Voice'
import CaptureFace, { TypeIcon } from '../components/CaptureFace'
import { Back, Close, Next, Trash } from '../components/icons'
import { useApp, useCaptures, useProfile } from '../lib/store'
import { api } from '../lib/api'
import { addDays, clock, dayKey, longDate } from '../lib/dates'
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
                {captures.length ? `${captures.length} ${captures.length === 1 ? 'entry' : 'entries'}` : ''}
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
          <p className="day-hint">{expanded ? 'Tap a moment to bring it to the front' : 'Swipe · tap to spread · double tap to open'}</p>
        )}
      </div>
    </Shell>
  )
}

/* ---------- The stack ----------
   Front card sits bottom left. Each card behind climbs the screen,
   alternating right, left, right… and tucking further in and getting
   slightly smaller, so the pile reads in perspective. With few cards
   they spread out (two cards: the second sits high up); with more,
   they close up. */

const TAB = 88 // room either side for the time tabs
const PAD = 12

function stackLayout(n, w, h) {
  const availW = w - TAB * 2
  const cardW = Math.max(96, Math.min(availW * 0.86, (h - PAD * 2) * 0.32))
  const cardH = cardW * (4 / 3)
  const slack = Math.max(0, availW - cardW)
  const vstep = n > 1 ? Math.min((h - PAD * 2 - cardH) / (n - 1), cardH * 0.9) : 0
  const tower = cardH + vstep * (n - 1)
  const bottom = h - PAD - Math.max(0, (h - PAD * 2 - tower) / 2)
  const inset = n > 1 ? (slack * 0.45) / (n - 1) : 0
  const strip = n > 1 ? Math.min(vstep, cardH) : cardH
  return Array.from({ length: n }, (_, d) => {
    const left = d % 2 === 0
    const scale = Math.max(0.74, 1 - d * 0.04)
    const x = left ? TAB + d * inset : TAB + slack - d * inset
    const y = bottom - cardH - d * vstep
    return { d, left, x, y, scale, cardW, cardH, tabY: y + Math.max(4, (strip * scale) / 2 - 12) }
  })
}

function FannedStack({ captures, index, setIndex, onTap, onDoubleTap }) {
  const ref = useRef()
  const [size, setSize] = useState(null)
  const [drag, setDrag] = useState(0)
  const g = useRef({ x: 0, active: false, moved: false, lastTap: 0, timer: null })

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  useEffect(() => () => clearTimeout(g.current.timer), [])

  const n = captures.length
  const depthOf = (i) => (i - index + n) % n
  const go = (d) => setIndex((index + d + n) % n)

  const handlers = {
    onPointerDown(e) {
      g.current = { ...g.current, x: e.clientX, active: true, moved: false }
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
        if (Math.abs(dx) > 50 && n > 1) go(dx < 0 ? 1 : -1)
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

  const slots = size ? stackLayout(n, size.w, size.h) : null

  return (
    <div className="stack" ref={ref} {...handlers}>
      {slots &&
        captures.map((c, i) => {
          const p = slots[depthOf(i)]
          const front = p.d === 0
          return (
            <div
              key={c.id}
              className={`card ${front ? 'front' : ''} ${front && drag ? 'dragging' : ''} type-${c.type}`}
              style={{
                width: p.cardW, height: p.cardH,
                transform: `translate(${p.x + (front ? drag : 0)}px, ${p.y}px) scale(${p.scale}) rotate(${front ? drag / 30 : 0}deg)`,
                transformOrigin: p.left ? 'left top' : 'right top',
                zIndex: 100 - p.d,
                '--shade': Math.min(p.d, 6) * 0.06,
              }}
            >
              <CaptureFace c={c} live={front} />
              {c.voice_note_url && c.type !== 'audio' && <span className="card-badge"><TypeIcon type="audio" size={12} /></span>}
            </div>
          )
        })}
      {slots &&
        captures.map((c, i) => {
          const p = slots[depthOf(i)]
          const right = p.left ? null : p.x + p.cardW
          const style = p.left
            ? { left: 4, width: p.x - 2, top: p.tabY }
            : { left: right - 2, width: size.w - right - 2, top: p.tabY }
          return (
            <button
              key={`t${c.id}`}
              className={`time-tab ${p.left ? 'l' : 'r'} ${i === index ? 'on' : ''}`}
              style={{ ...style, zIndex: 200 }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => setIndex(i)}
              aria-label={`${clock(new Date(c.taken_at))}, bring to front`}
            >
              <span className="pill"><TypeIcon type={c.type} size={13} />{clock(new Date(c.taken_at))}</span>
              <span className="line" />
            </button>
          )
        })}
    </div>
  )
}

/* ---------- Tap: spread the whole day out ---------- */

function Spread({ captures, index, onPick }) {
  return (
    <div className="spread">
      {captures.map((c, i) => (
        <button key={c.id} className={`spread-item type-${c.type} ${i === index ? 'on' : ''}`} style={{ '--i': i }} onClick={() => onPick(i)}>
          <CaptureFace c={c} />
          <span className="pill"><TypeIcon type={c.type} size={11} />{clock(new Date(c.taken_at))}</span>
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
  const visual = c.type === 'photo' || c.type === 'video' || c.type === 'drawing'
  return (
    <div className={`full type-${c.type} ${visual ? 'visual' : 'paper-bg'}`} {...swipe} onClick={tap}>
      {visual && c.type !== 'drawing' && <div className="full-bg" style={{ backgroundImage: `url(${c.thumb_url || c.media_url})` }} />}
      {c.type === 'video' ? (
        <video key={c.id} className="full-media" src={c.media_url} autoPlay loop playsInline controls />
      ) : visual ? (
        <img key={c.id} className="full-media" src={c.media_url} alt="" />
      ) : c.type === 'text' ? (
        <div key={c.id} className="full-text"><p>{c.body}</p></div>
      ) : (
        <div key={c.id} className="full-audio" onClick={(e) => e.stopPropagation()}>
          <TypeIcon type="audio" size={44} strokeWidth={1.25} />
          <VoicePlayer src={c.media_url} label="Play voice note" />
        </div>
      )}
      <div className="full-top">
        <span className="count-chip"><TypeIcon type={c.type} size={12} /> {index + 1} / {n}</span>
        <div className="row">
          {onDelete && (
            <button className={`icon-btn glass ${armed ? 'armed' : ''}`} onClick={(e) => { e.stopPropagation(); armed ? onDelete(c) : setArmed(true) }} aria-label={armed ? 'Tap again to delete' : 'Delete'}>
              {armed ? <span className="armed-label">Delete?</span> : <Trash />}
            </button>
          )}
          <button className="icon-btn glass" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Close"><Close /></button>
        </div>
      </div>
      <MetaOverlay at={c.taken_at} place={c.place_name} lat={c.latitude} lng={c.longitude}>
        {c.comment && <p className="meta-comment">{c.comment}</p>}
        {c.voice_note_url && <VoicePlayer src={c.voice_note_url} />}
      </MetaOverlay>
      <div className="dots">{captures.map((x, i) => <span key={x.id} className={i === index ? 'on' : ''} />)}</div>
    </div>
  )
}
