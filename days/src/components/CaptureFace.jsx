import { Camera, Mic, Scribble, TextNote, Video } from './icons'

const ICONS = { photo: Camera, video: Video, audio: Mic, drawing: Scribble, text: TextNote }
const LABELS = { photo: 'Photo', video: 'Video', audio: 'Voice note', drawing: 'Drawing', text: 'Note' }

/** The small icon that says what kind of capture this is. */
export function TypeIcon({ type, size = 14, ...p }) {
  const I = ICONS[type] || Camera
  return <I size={size} aria-label={LABELS[type]} {...p} />
}
export const typeLabel = (t) => LABELS[t] || 'Capture'

/**
 * What a capture looks like on a card, a calendar square or the spread:
 * photos, videos and drawings show their picture; voice notes and text
 * notes show an icon or their words, plus the title if there is one.
 * `live` plays videos (only the front card).
 */
export default function CaptureFace({ c, live = false, compact = false }) {
  if (c.type === 'video' && live)
    return <video className="face-media" src={c.media_url} poster={c.thumb_url || undefined} autoPlay muted loop playsInline />
  if (c.type === 'photo' || c.type === 'video' || c.type === 'drawing') {
    const src = live ? c.media_url : c.thumb_url || c.media_url
    return <img className={`face-media ${c.type === 'drawing' ? 'drawing' : ''}`} src={src} alt="" draggable={false} loading="lazy" />
  }
  if (c.type === 'text')
    return (
      <div className={`face face-text ${compact ? 'compact' : ''}`}>
        {c.comment && !compact && <strong>{c.comment}</strong>}
        <p>{c.body}</p>
      </div>
    )
  return (
    <div className={`face face-audio ${compact ? 'compact' : ''}`}>
      <Mic size={compact ? 16 : 34} strokeWidth={1.5} />
      {c.comment && !compact && <strong>{c.comment}</strong>}
      {!compact && <span className="face-kicker">Voice note</span>}
    </div>
  )
}
