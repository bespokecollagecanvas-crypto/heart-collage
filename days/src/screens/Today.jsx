import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Shell from '../components/Shell'
import MetaOverlay from '../components/MetaOverlay'
import { VoicePlayer, VoiceRecorder } from '../components/Voice'
import NoteComposer from '../components/NoteComposer'
import VoiceCapture from '../components/VoiceCapture'
import CaptureFace from '../components/CaptureFace'
import { PrivacySwitch, defaultPublic } from '../components/Privacy'
import { Flame, Flip, Gear, Image } from '../components/icons'
import { useApp } from '../lib/store'
import { api } from '../lib/api'
import { dayKey } from '../lib/dates'
import { locate } from '../lib/location'
import { frameToBlob, makeThumb, pickMime, videoThumb } from '../lib/media'

const HOLD_MS = 350
const MAX_VIDEO_S = 15

export default function Today() {
  const { profile, todayCount, streak, bump, setToast } = useApp()
  const nav = useNavigate()
  const videoRef = useRef()
  const streamRef = useRef()
  const fileRef = useRef()
  const [facing, setFacing] = useState('environment')
  const [camError, setCamError] = useState(null)
  const [now, setNow] = useState(new Date())
  const [loc, setLoc] = useState({})
  const [recSecs, setRecSecs] = useState(null)
  const [pending, setPending] = useState(null)
  const [flash, setFlash] = useState(false)
  const [mode, setMode] = useState('camera') // camera | voice | note
  const [sp, setSp] = useSearchParams()
  const voiceRef = useRef()
  const noteRef = useRef()

  // While writing or drawing, the red button (and the pen) mean Done.
  function finishNote() {
    if (noteRef.current?.ready) noteRef.current.done()
    else setMode('camera')
  }

  // The pen and mic buttons on other screens open this screen with ?new=note or ?new=voice
  useEffect(() => {
    const want = sp.get('new')
    if (want === 'note' || want === 'voice') {
      openMode(want)
      setSp({}, { replace: true })
    }
  }, [sp])

  function openMode(m) {
    if (pending) return
    setMode(m)
  }

  // Live clock and location for the overlay
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    let alive = true
    const go = () => locate().then((l) => alive && setLoc(l))
    go()
    const t = setInterval(go, 120000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  // Camera on while this screen is showing (paused during review)
  useEffect(() => {
    if (pending || mode !== 'camera') return
    let cancelled = false
    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    async function start() {
      if (import.meta.env.VITE_PREVIEW === '1') return setCamError('preview')
      if (!navigator.mediaDevices?.getUserMedia) return setCamError('This browser can’t open the camera.')
      stop()
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        })
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        streamRef.current = s
        videoRef.current.srcObject = s
        await videoRef.current.play().catch(() => {})
        setCamError(null)
      } catch (e) {
        setCamError(e.name === 'NotAllowedError' ? 'Camera permission is off. Allow it in your browser settings, or choose a photo instead.' : 'No camera found. You can choose a photo instead.')
      }
    }
    start()
    const vis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', vis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', vis)
      stop()
    }
  }, [facing, pending, mode])

  // ---- capture ----
  const press = useRef({ down: false, timer: null, state: 'idle', stopAsked: false, recorder: null, auto: null })

  async function takePhoto() {
    const v = videoRef.current
    if (!v?.videoWidth) return
    setFlash(true)
    setTimeout(() => setFlash(false), 180)
    const takenAt = new Date()
    const file = await frameToBlob(v, facing === 'user')
    const thumb = await makeThumb(file)
    setPending({ file, thumb, type: 'photo', takenAt, url: URL.createObjectURL(file), loc })
  }

  async function startRecording() {
    const p = press.current
    const mime = pickMime('video')
    if (mime === null || !streamRef.current) {
      p.state = 'idle'
      return setToast('Video recording isn’t supported here')
    }
    p.state = 'starting'
    const tracks = [...streamRef.current.getVideoTracks()]
    let mic = null
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      tracks.push(...mic.getAudioTracks())
    } catch {
      /* video without sound is fine */
    }
    const r = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime } : undefined)
    const chunks = []
    const takenAt = new Date()
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    r.onstop = async () => {
      mic?.getTracks().forEach((t) => t.stop())
      const file = new Blob(chunks, { type: r.mimeType || mime || 'video/webm' })
      const thumb = await videoThumb(file)
      setPending({ file, thumb, type: 'video', takenAt, url: URL.createObjectURL(file), loc })
    }
    r.start(250)
    p.recorder = r
    p.state = 'recording'
    setRecSecs(0)
    p.auto = setTimeout(stopRecording, MAX_VIDEO_S * 1000)
    if (p.stopAsked) setTimeout(stopRecording, 800)
  }

  function stopRecording() {
    const p = press.current
    clearTimeout(p.auto)
    if (p.recorder?.state === 'recording') p.recorder.stop()
    p.recorder = null
    p.state = 'idle'
    p.stopAsked = false
    setRecSecs(null)
  }

  useEffect(() => {
    if (recSecs === null) return
    const t = setTimeout(() => setRecSecs((s) => (s === null ? s : s + 1)), 1000)
    return () => clearTimeout(t)
  }, [recSecs])

  const shutterHandlers = {
    onPointerDown(e) {
      if (mode === 'voice') return voiceRef.current?.stop()
      if (mode === 'note') return finishNote()
      if (camError) return fileRef.current.click()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const p = press.current
      p.down = true
      p.stopAsked = false
      p.timer = setTimeout(() => {
        if (p.down) startRecording()
      }, HOLD_MS)
    },
    onPointerUp() {
      if (mode !== 'camera') return
      const p = press.current
      if (!p.down) return
      p.down = false
      clearTimeout(p.timer)
      if (p.state === 'recording') stopRecording()
      else if (p.state === 'starting') p.stopAsked = true
      else takePhoto()
    },
    onPointerCancel() {
      const p = press.current
      p.down = false
      clearTimeout(p.timer)
      if (p.state === 'recording') stopRecording()
    },
    onContextMenu: (e) => e.preventDefault(),
  }

  async function onFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const video = f.type.startsWith('video')
    const thumb = video ? await videoThumb(f) : await makeThumb(f)
    setPending({ file: f, thumb, type: video ? 'video' : 'photo', takenAt: new Date(), url: URL.createObjectURL(f), loc })
  }

  async function save({ comment, voiceNote, isPublic }) {
    const p = pending
    const l = p.loc?.lat ? p.loc : loc
    await api.captures.create({
      file: p.file, thumb: p.thumb, type: p.type, body: p.body, takenAt: p.takenAt, day: dayKey(p.takenAt),
      lat: l.lat ?? null, lng: l.lng ?? null, placeName: l.placeName ?? null, comment, voiceNote, isPublic,
    })
    if (p.url) URL.revokeObjectURL(p.url)
    setPending(null)
    setMode('camera')
    bump()
    setToast(`Saved ${isPublic ? 'public' : 'private'} · ${todayCount + 1} today`)
  }

  function discard() {
    if (pending.url) URL.revokeObjectURL(pending.url)
    setPending(null)
    setMode('camera')
  }

  const fromComposer = (p) => setPending({ ...p, takenAt: new Date(), loc })

  const recording = recSecs !== null
  const shutter = (
    <button
      className={`shutter ${recording || mode === 'voice' ? 'rec' : ''}`}
      aria-label={mode === 'voice' ? 'Finish voice note' : mode === 'note' ? 'Save note' : 'Tap for photo, hold for video'}
      disabled={!!pending}
      {...shutterHandlers}
    >
      <span />
      {recording && (
        <svg className="rec-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" style={{ animationDuration: `${MAX_VIDEO_S}s` }} />
        </svg>
      )}
    </button>
  )

  return (
    <Shell
      left={<Link className="icon-btn" to="/settings" aria-label="Settings"><Gear /></Link>}
      right={<Link className="streak" to={`/u/${profile.username}/m/${dayKey().slice(0, 7)}`}><Flame size={18} /> {streak}</Link>}
      onCentre={() => nav(`/u/${profile.username}/m/${dayKey().slice(0, 7)}`)}
      centreLabel="My calendar"
      shutter={shutter}
      onPen={() => (mode === 'note' ? finishNote() : openMode('note'))}
      onMic={() => (mode === 'voice' ? voiceRef.current?.stop() : mode === 'note' && noteRef.current?.ready ? setToast('Tap the red button to save your note first') : openMode('voice'))}
      active={pending ? null : mode}
      stageClass={mode === 'camera' && !pending ? 'camera-stage' : ''}
    >
      {pending ? (
        <Review pending={pending} onSave={save} onDiscard={discard} />
      ) : mode === 'note' ? (
        <NoteComposer ref={noteRef} onDone={fromComposer} onCancel={() => setMode('camera')} />
      ) : mode === 'voice' ? (
        <VoiceCapture ref={voiceRef} onDone={fromComposer} onCancel={() => setMode('camera')} />
      ) : (
        <div className="viewfinder">
          <video ref={videoRef} playsInline muted autoPlay className={facing === 'user' ? 'mirror' : ''} />
          {camError && (
            <div className="cam-error">
              <p>{camError === 'preview' ? 'This preview can’t show a live camera. Tap the red button to take a photo or choose one.' : camError}</p>
              <button className="btn primary" onClick={() => fileRef.current.click()}><Image size={18} /> {camError === 'preview' ? 'Take or choose a photo' : 'Choose a photo'}</button>
            </div>
          )}
          {flash && <div className="flash" />}
          <div className="vf-top">
            <span className="count-chip">{todayCount} today</span>
            {recording ? (
              <span className="rec-chip">● {recSecs}s</span>
            ) : (
              !camError && <button className="icon-btn glass" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')} aria-label="Flip camera"><Flip /></button>
            )}
          </div>
          <MetaOverlay at={now} place={loc.placeName} lat={loc.lat} lng={loc.lng}>
            {!recording && !camError && <div className="hint">Tap for photo · hold for video</div>}
          </MetaOverlay>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />
    </Shell>
  )
}

function Review({ pending, onSave, onDiscard }) {
  const [comment, setComment] = useState('')
  const [voiceNote, setVoiceNote] = useState(null)
  const [isPublic, setIsPublic] = useState(defaultPublic(pending.type))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function save() {
    setBusy(true)
    setErr(null)
    try {
      await onSave({ comment: comment.trim(), voiceNote, isPublic })
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="review">
      <div className={`review-media ${pending.type}`}>
        {pending.type === 'video' ? (
          <video src={pending.url} playsInline autoPlay loop muted={false} controls={false} />
        ) : pending.type === 'audio' ? (
          <div className="face face-audio big"><VoicePlayer src={pending.url} label="Play back" /></div>
        ) : pending.type === 'text' ? (
          <CaptureFace c={{ type: 'text', body: pending.body }} />
        ) : (
          <img src={pending.url} alt="" />
        )}
        <MetaOverlay at={pending.takenAt} place={pending.loc?.placeName} lat={pending.loc?.lat} lng={pending.loc?.lng} />
      </div>
      <div className="review-panel">
        <PrivacySwitch value={isPublic} onChange={setIsPublic} />
        <input className="comment-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={pending.type === 'photo' || pending.type === 'video' ? 'Add a comment (optional)' : 'Add a title or note (optional)'} maxLength={280} />
        {pending.type !== 'audio' && <VoiceRecorder value={voiceNote} onChange={setVoiceNote} />}
        {err && <p className="note err">{err}</p>}
        <div className="review-actions">
          <button className="btn ghost" onClick={onDiscard} disabled={busy}>{pending.type === 'photo' || pending.type === 'video' ? 'Retake' : 'Discard'}</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Keep it'}</button>
        </div>
      </div>
    </div>
  )
}
