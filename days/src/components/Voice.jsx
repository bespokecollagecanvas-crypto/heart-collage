import { useEffect, useRef, useState } from 'react'
import { pickMime } from '../lib/media'
import { Mic, Pause, Play, Trash } from './icons'

/** Play button for a voice note. */
export function VoicePlayer({ src, label = 'Voice note' }) {
  const a = useRef()
  const [playing, setPlaying] = useState(false)
  return (
    <button type="button" className="chip voice" onClick={(e) => {
      e.stopPropagation()
      if (playing) a.current.pause()
      else a.current.play()
    }}>
      {playing ? <Pause size={16} /> : <Play size={16} />} {label}
      <audio ref={a} src={src} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </button>
  )
}

/** Tap to start recording a voice note, tap again to stop. */
export function VoiceRecorder({ value, onChange }) {
  const [secs, setSecs] = useState(null)
  const rec = useRef()
  const url = useRef()
  if (value && !url.current) url.current = URL.createObjectURL(value)
  if (!value) url.current = null

  useEffect(() => {
    if (secs === null) return
    const t = setTimeout(() => (secs >= 59 ? stop() : setSecs(secs + 1)), 1000)
    return () => clearTimeout(t)
  }, [secs])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = pickMime('audio')
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks = []
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        onChange(new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' }))
      }
      r.start()
      rec.current = r
      setSecs(0)
    } catch {
      alert('Microphone not available. Check that Days is allowed to use it.')
    }
  }
  function stop() {
    rec.current?.stop()
    rec.current = null
    setSecs(null)
  }

  if (value)
    return (
      <div className="voice-row">
        <VoicePlayer src={url.current} />
        <button type="button" className="icon-btn small" onClick={() => onChange(null)} aria-label="Remove voice note"><Trash size={18} /></button>
      </div>
    )
  return (
    <button type="button" className={`chip voice ${secs !== null ? 'live' : ''}`} onClick={secs === null ? start : stop}>
      <Mic size={16} /> {secs === null ? 'Add voice note' : `Recording 0:${String(secs).padStart(2, '0')} · tap to stop`}
    </button>
  )
}
