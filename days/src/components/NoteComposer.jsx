import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { makeThumb } from '../lib/media'
import { Close, Undo } from './icons'

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/**
 * A blank page. Tap it to type (or paste) a note.
 * Start moving a finger across it and it becomes a drawing, and stays one.
 */
const DRAFT = 'days-note-draft'
const readDraft = () => {
  try {
    return localStorage.getItem(DRAFT) || ''
  } catch {
    return ''
  }
}
const writeDraft = (t) => {
  try {
    if (t) localStorage.setItem(DRAFT, t)
    else localStorage.removeItem(DRAFT)
  } catch {
    /* drafts are a convenience only */
  }
}

const NoteComposer = forwardRef(function NoteComposer({ onDone, onCancel }, ref) {
  const [text, setText] = useState(readDraft)
  const [mode, setMode] = useState(() => (readDraft() ? 'text' : null)) // null = undecided, 'text' or 'drawing'
  const [strokes, setStrokes] = useState([])
  const surface = useRef()
  const canvas = useRef()
  const textarea = useRef()
  const cur = useRef(null)
  const dpr = Math.min(window.devicePixelRatio || 1, 3)

  const ctx = () => {
    const c = canvas.current.getContext('2d')
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = 3 * dpr
    c.strokeStyle = css('--ink') || '#111'
    return c
  }

  function drawStroke(c, pts) {
    if (!pts.length) return
    c.beginPath()
    c.moveTo(pts[0][0], pts[0][1])
    if (pts.length === 1) c.lineTo(pts[0][0] + 0.1, pts[0][1])
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2
      const my = (pts[i][1] + pts[i + 1][1]) / 2
      c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
    }
    if (pts.length > 1) c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
    c.stroke()
  }

  function redraw(list = strokes) {
    if (!canvas.current) return
    const c = ctx()
    c.clearRect(0, 0, canvas.current.width, canvas.current.height)
    list.forEach((s) => drawStroke(c, s))
  }

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      canvas.current.width = Math.round(width * dpr)
      canvas.current.height = Math.round(height * dpr)
      redraw()
    })
    ro.observe(surface.current)
    return () => ro.disconnect()
  }, [])
  useEffect(() => redraw(), [strokes])
  // Typed text is kept as a draft until it is saved, so it is never lost.
  useEffect(() => writeDraft(mode === 'text' ? text : ''), [text, mode])
  useEffect(() => {
    if (mode === 'text') textarea.current?.focus()
  }, [mode])

  const point = (e) => {
    const r = canvas.current.getBoundingClientRect()
    return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]
  }

  const handlers =
    mode === 'text'
      ? {}
      : {
          onPointerDown(e) {
            e.currentTarget.setPointerCapture?.(e.pointerId)
            cur.current = { pts: [point(e)], start: [e.clientX, e.clientY], drawing: mode === 'drawing' }
          },
          onPointerMove(e) {
            const s = cur.current
            if (!s) return
            const events = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent]
            for (const ev of events) s.pts.push(point(ev))
            if (!s.drawing && Math.hypot(e.clientX - s.start[0], e.clientY - s.start[1]) > 6) {
              s.drawing = true
              setMode('drawing')
            }
            if (s.drawing) {
              redraw()
              drawStroke(ctx(), s.pts)
            }
          },
          onPointerUp() {
            const s = cur.current
            cur.current = null
            if (!s) return
            if (s.drawing || mode === 'drawing') setStrokes((list) => [...list, s.pts])
            else setMode('text')
          },
          onPointerCancel() {
            cur.current = null
            redraw()
          },
        }

  function clear() {
    setStrokes([])
    setText('')
    setMode(null)
  }
  function undo() {
    const next = strokes.slice(0, -1)
    setStrokes(next)
    if (!next.length) setMode(null)
  }

  async function done() {
    if (mode === 'text') {
      writeDraft('')
      return onDone({ type: 'text', body: text.trim() })
    }
    const c = canvas.current
    const out = document.createElement('canvas')
    out.width = c.width
    out.height = c.height
    const o = out.getContext('2d')
    o.fillStyle = css('--paper') || '#fff'
    o.fillRect(0, 0, out.width, out.height)
    o.drawImage(c, 0, 0)
    const file = await new Promise((r) => out.toBlob(r, 'image/png'))
    const thumb = await makeThumb(file)
    onDone({ type: 'drawing', file, thumb, url: URL.createObjectURL(file) })
  }

  const ready = (mode === 'text' && text.trim()) || (mode === 'drawing' && strokes.length)
  useImperativeHandle(ref, () => ({ done, ready: !!ready }), [ready, mode, text, strokes])
  const hint =
    mode === 'drawing' ? 'Drawing · red button saves' : mode === 'text' ? 'Note · red button saves' : 'Tap to type · drag to draw'

  return (
    <div className="composer">
      <div className="composer-bar">
        <button className="icon-btn small" onClick={onCancel} aria-label="Close (typed text is kept as a draft)"><Close size={20} /></button>
        <span className="eyebrow">{hint}</span>
        <div className="row">
          {mode === 'drawing' && <button className="icon-btn small" onClick={undo} aria-label="Undo"><Undo size={20} /></button>}
          {mode && <button className="btn small ghost" onClick={clear}>Clear</button>}
          <button className="btn small primary" disabled={!ready} onClick={done}>Done</button>
        </div>
      </div>
      <div className={`paper ${mode || 'blank'}`} ref={surface} {...handlers}>
        <canvas ref={canvas} />
        {mode === null && (
          <div className="paper-hint">
            <p>Type an idea, paste some text, or sketch it out with your finger.</p>
          </div>
        )}
        {mode === 'text' && (
          <textarea
            ref={textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => !text.trim() && setMode(null)}
            placeholder="Write it down…"
            maxLength={5000}
          />
        )}
      </div>
    </div>
  )
})

export default NoteComposer
