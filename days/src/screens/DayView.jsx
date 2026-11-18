import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Shell from '../components/Shell'
import MetaOverlay from '../components/MetaOverlay'
import { VoicePlayer } from '../components/Voice'
import CaptureFace, { TypeIcon } from '../components/CaptureFace'
import { PrivacyChip } from '../components/Privacy'
import { Lock } from '../components/icons'
import { Back, Close, Next, Trash } from '../components/icons'
import { useApp, useCaptures, useProfile } from '../lib/store'
import { api } from '../lib/api'
import { addDays, clock, dayKey, longDate } from '../lib/dates'
import { usePinch, useSwipe } from '../lib/gestures'

// Open question in the brief: which capture sits at the front when a day opens.
// 'first' = the day reads from morning onwards. Change to 'last' to start from the most recent.
const START_AT = 'first'

// A comment on a photo, video or drawing also gets its own white note card,
// placed right after the capture it belongs to.
const VISUAL = new Set(['photo', 'video', 'drawing'])
function withNoteCards(list) {
  const out = []
  for (const c of list) {
    out.push(c)
    if (c.comment && VISUAL.has(c.type))
      out.push({
        id: `${c.id}:note`, type: 'text', body: c.comment, taken_at: c.taken_at, day: c.day,
        place_name: c.place_name, latitude: c.latitude, longitude: c.longitude,
        is_public: c.is_public, user_id: c.user_id, virtual: true,
      })
  }
  return out
}

export default function DayView() {
  const { username, day } = useParams()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { setToast, bump } = useApp()
  const { person, mine } = useProfile(username)
  const { captures, loading } = useCaptures(person?.id, day, day)
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState([])
  const items = useMemo(() => withNoteCards(captures), [captures])
  const full = sp.get('full') === '1'
  const stageRef = useRef()
  const month = day.slice(0, 7)

  useEffect(() => {
    const want = Number(sp.get('i'))
    setIndex(Number.isFinite(want) && sp.has('i') ? want : START_AT === 'last' ? Math.max(0, items.length - 1) : 0)
    setExpanded(false)
    setDismissed([])
  }, [day, items.length])

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

  async function togglePrivacy(c) {
    try {
      await api.captures.update(c.id, { is_public: !c.is_public })
      setToast(c.is_public ? 'Now private: only you can see it' : 'Now public: shown on your profile')
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
          <FullView captures={items} index={Math.min(index, items.length - 1)} setIndex={setIndex} onClose={() => setFull(false)} onDelete={mine ? remove : null} onPrivacy={mine ? togglePrivacy : null} />
        ) : expanded ? (
          <Spread captures={items} index={index} onPick={(i) => { setIndex(i); setDismissed((d) => d.filter((x) => x !== items[i].id)); setExpanded(false) }} />
        ) : (
          <FannedStack captures={items} index={index} setIndex={setIndex} onOpen={() => setFull(true)} mine={mine} dismissed={dismissed} setDismissed={setDismissed} />
        )}

        {!full && captures.length > 0 && (
          <div className="day-foot">
            <p className="day-hint">{expanded ? 'Tap one to pick it' : 'Swipe sideways to pick · down to clear · up to bring back'}</p>
            <button className="btn small ghost" onClick={() => setExpanded(!expanded)}>{expanded ? 'Stack' : 'Spread'}</button>
          </div>
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

function FannedStack({ captures, index, setIndex, onOpen, mine, dismissed, setDismissed }) {
  const ref = useRef()
  const [size, setSize] = useState(null)
  const g = useRef({ x: 0, y: 0, active: false, target: null, lastTap: 0, lastCard: -1 })

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const n = captures.length
  const gone = new Set(dismissed)
  const isGone = (i) => gone.has(captures[i]?.id)
  // Cards never move. Sideways swipes or taps swap which card is in front;
  // a downward swipe clears a card away; an upward swipe brings the last one back.

  function step(d) {
    let j = index + d
    while (j >= 0 && j < n && isGone(j)) j += d
    if (j >= 0 && j < n) setIndex(j)
  }
  function dismiss(i) {
    if (isGone(i)) return
    const left = new Set([...dismissed, captures[i].id])
    setDismissed([...dismissed, captures[i].id])
    let j = captures.findIndex((c, k) => k > i && !left.has(c.id))
    if (j < 0) j = captures.findLastIndex((c, k) => k < i && !left.has(c.id))
    if (j >= 0) setIndex(j)
  }
  function restore(i) {
    const id = i == null ? dismissed[dismissed.length - 1] : captures[i].id
    if (!id) return
    setDismissed(dismissed.filter((x) => x !== id))
    setIndex(captures.findIndex((c) => c.id === id))
  }

  const handlers = {
    onPointerDown(e) {
      const card = e.target.closest?.('.card[data-i]')
      const hit = e.target.closest?.('[data-i]')
      // Keep following this finger even if it leaves the stack mid-swipe.
      e.currentTarget.setPointerCapture?.(e.pointerId)
      g.current = { ...g.current, x: e.clientX, y: e.clientY, active: true, target: card ? Number(card.dataset.i) : null, hit: hit ? Number(hit.dataset.i) : null }
    },
    onPointerUp(e) {
      const s = g.current
      if (!s.active) return
      s.active = false
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) return dy > 0 ? dismiss(s.target ?? index) : restore()
      if (Math.abs(dx) > 40) return step(dx < 0 ? 1 : -1)
      if (Math.hypot(dx, dy) > 10) return
      const i = s.hit
      if (i == null) return
      if (isGone(i)) return restore(i)
      const t = Date.now()
      if (t - s.lastTap < 320 && s.lastCard === i) {
        s.lastTap = 0
        setIndex(i)
        onOpen()
      } else {
        s.lastTap = t
        s.lastCard = i
        setIndex(i)
      }
    },
    onPointerCancel() {
      g.current.active = false
    },
  }

  const slots = size ? stackLayout(n, size.w, size.h) : null
  const allGone = n > 0 && dismissed.length >= n

  return (
    <div className="stack" ref={ref} {...handlers}>
      {slots &&
        captures.map((c, i) => {
          const p = slots[i]
          const on = i === index && !isGone(i)
          const out = isGone(i)
          return (
            <div
              key={c.id}
              data-i={i}
              className={`card ${on ? 'front picked' : ''} ${out ? 'gone' : ''} type-${c.type}`}
              style={{
                width: p.cardW, height: p.cardH,
                transform: `translate(${p.x}px, ${p.y + (out ? 80 : 0)}px) scale(${p.scale})`,
                transformOrigin: p.left ? 'left top' : 'right top',
                zIndex: on ? 150 : 100 - i,
                '--shade': on ? 0 : Math.min(i, 6) * 0.05,
              }}
            >
              <CaptureFace c={c} live={on} />
              {mine && !c.is_public && !c.virtual && <span className="lock-badge" aria-label="Private"><Lock size={11} /></span>}
              {c.voice_note_url && c.type !== 'audio' && <span className="card-badge"><TypeIcon type="audio" size={12} /></span>}
            </div>
          )
        })}
      {slots &&
        captures.map((c, i) => {
          const p = slots[i]
          const right = p.left ? null : p.x + p.cardW
          const style = p.left
            ? { left: 4, width: p.x - 2, top: p.tabY }
            : { left: right - 2, width: size.w - right - 2, top: p.tabY }
          return (
            <button
              key={`t${c.id}`}
              data-i={i}
              className={`time-tab ${p.left ? 'l' : 'r'} ${i === index && !isGone(i) ? 'on' : ''} ${isGone(i) ? 'gone' : ''}`}
              style={{ ...style, zIndex: 200 }}
              aria-label={`${clock(new Date(c.taken_at))}, ${isGone(i) ? 'bring back' : 'show this one'}`}
            >
              <span className="pill"><TypeIcon type={c.type} size={13} />{clock(new Date(c.taken_at))}</span>
              <span className="line" />
            </button>
          )
        })}
      {allGone && <p className="stack-empty">All cleared · swipe up to bring them back</p>}
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
          {!c.is_public && <span className="lock-badge"><Lock size={10} /></span>}
          <span className="pill"><TypeIcon type={c.type} size={11} />{clock(new Date(c.taken_at))}</span>
        </button>
      ))}
    </div>
  )
}

/* ---------- Double tap: full screen ---------- */

function FullView({ captures, index, setIndex, onClose, onDelete, onPrivacy }) {
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
        <div className="row">
          <span className="count-chip"><TypeIcon type={c.type} size={12} /> {index + 1} / {n}</span>
          {onPrivacy && !c.virtual && <PrivacyChip isPublic={!!c.is_public} onToggle={() => onPrivacy(c)} />}
        </div>
        <div className="row">
          {onDelete && !c.virtual && (
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
