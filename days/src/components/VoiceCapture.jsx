import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { pickMime } from '../lib/media'
import { Close } from './icons'

const MAX_S = 180
const BARS = 28

/** Records a standalone voice note as soon as it opens. */
const VoiceCapture = forwardRef(function VoiceCapture({ onDone, onCancel }, ref) {
  const [secs, setSecs] = useState(0)
  const [err, setErr] = useState(null)
  const [levels, setLevels] = useState(() => Array(BARS).fill(0))
  const r = useRef({})

  useEffect(() => {
    let alive = true
    const s = r.current
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!alive) return stream.getTracks().forEach((t) => t.stop())
        s.stream = stream
        const mime = pickMime('audio')
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        const chunks = []
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          s.audioCtx?.close()
          if (s.discard) return
          const file = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' })
          onDone({ type: 'audio', file, url: URL.createObjectURL(file) })
        }
        rec.start(250)
        s.rec = rec
        s.started = Date.now()
        // Level meter
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC) {
          s.audioCtx = new AC()
          const an = s.audioCtx.createAnalyser()
          an.fftSize = 256
          s.audioCtx.createMediaStreamSource(stream).connect(an)
          const buf = new Uint8Array(an.fftSize)
          const tick = () => {
            if (!alive || s.rec?.state !== 'recording') return
            an.getByteTimeDomainData(buf)
            let peak = 0
            for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128)
            setLevels((l) => [...l.slice(1), Math.min(1, peak * 2.2)])
            setSecs(Math.floor((Date.now() - s.started) / 1000))
            s.raf = requestAnimationFrame(tick)
          }
          tick()
        }
        s.timer = setInterval(() => {
          const t = Math.floor((Date.now() - s.started) / 1000)
          setSecs(t)
          if (t >= MAX_S) stop()
        }, 500)
      } catch {
        setErr('Microphone not available. Allow Days to use it in your browser settings.')
      }
    })()
    return () => {
      alive = false
      s.discard = true
      clearInterval(s.timer)
      cancelAnimationFrame(s.raf)
      if (s.rec?.state === 'recording') s.rec.stop()
      else s.stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function stop() {
    const s = r.current
    clearInterval(s.timer)
    cancelAnimationFrame(s.raf)
    if (s.rec?.state === 'recording') s.rec.stop()
  }
  function cancel() {
    r.current.discard = true
    stop()
    onCancel()
  }
  useImperativeHandle(ref, () => ({ stop }))

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <div className="voice-capture">
      <div className="composer-bar">
        <button className="icon-btn small" onClick={cancel} aria-label="Cancel"><Close size={20} /></button>
        <span className="eyebrow">{err ? 'Voice note' : <><i className="rec-dot" /> Recording</>}</span>
        <span className="eyebrow muted">max 3:00</span>
      </div>
      {err ? (
        <p className="vc-error">{err}</p>
      ) : (
        <div className="vc-body">
          <div className="vc-time">{mm}:{ss}</div>
          <div className="vc-meter">{levels.map((l, i) => <span key={i} style={{ transform: `scaleY(${0.08 + l * 0.92})` }} />)}</div>
          <p className="vc-hint">Tap the red button to finish</p>
        </div>
      )}
    </div>
  )
})

export default VoiceCapture
