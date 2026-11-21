import { Globe, Lock } from './icons'

/** Photos and videos start public; voice notes, text notes and drawings start private. */
export const defaultPublic = (type) => type === 'photo' || type === 'video'

/** The big Private / Public switch shown before saving. */
export function PrivacySwitch({ value, onChange }) {
  return (
    <div className="privacy" role="radiogroup" aria-label="Who can see this">
      <button type="button" role="radio" aria-checked={!value} className={!value ? 'on' : ''} onClick={() => onChange(false)}>
        <Lock size={16} />
        <span><b>Private</b><small>Only you</small></span>
      </button>
      <button type="button" role="radio" aria-checked={value} className={value ? 'on' : ''} onClick={() => onChange(true)}>
        <Globe size={16} />
        <span><b>Public</b><small>On your profile</small></span>
      </button>
    </div>
  )
}

/** Compact chip for changing it later (full screen view). */
export function PrivacyChip({ isPublic, onToggle }) {
  return (
    <button type="button" className={`privacy-chip ${isPublic ? 'public' : 'private'}`} onClick={(e) => { e.stopPropagation(); onToggle?.() }} disabled={!onToggle}>
      {isPublic ? <Globe size={13} /> : <Lock size={13} />}
      {isPublic ? 'Public' : 'Private'}
    </button>
  )
}
