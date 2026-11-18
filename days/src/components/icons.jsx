const S = ({ children, size = 24, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
)
export const Back = (p) => <S {...p}><path d="M15 18l-6-6 6-6" /></S>
export const Next = (p) => <S {...p}><path d="M9 18l6-6-6-6" /></S>
export const Gear = (p) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></S>
export const People = (p) => <S {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></S>
export const Flip = (p) => <S {...p}><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M9 13a3 3 0 0 1 5.2-2M15 13a3 3 0 0 1-5.2 2" /><path d="M14 9v2h-2M10 17v-2h2" /></S>
export const Close = (p) => <S {...p}><path d="M18 6L6 18M6 6l12 12" /></S>
export const Trash = (p) => <S {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></S>
export const Mic = (p) => <S {...p}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></S>
export const Play = (p) => <S {...p}><path d="M7 4l13 8-13 8z" fill="currentColor" /></S>
export const Pause = (p) => <S {...p}><path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" /></S>
export const Pin = (p) => <S {...p}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></S>
export const Flame = (p) => <S {...p}><path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.4-5.6-3.6-8.4-.6 2-1.6 3-2.8 3.4C12.8 7 11 4.3 9 2c0 4-5 6.5-5 13.2C4 19.3 8 22 12 22z" /></S>
export const Stack = (p) => <S {...p}><rect x="4" y="7" width="13" height="14" rx="2" /><path d="M8 3h10a2 2 0 0 1 2 2v12" /></S>
export const Check = (p) => <S {...p}><path d="M20 6L9 17l-5-5" /></S>
export const Search = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></S>
export const Expand = (p) => <S {...p}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></S>
export const Image = (p) => <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></S>
export const Pen = (p) => <S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></S>
export const Camera = (p) => <S {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></S>
export const Video = (p) => <S {...p}><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></S>
export const TextNote = (p) => <S {...p}><path d="M4 6h16M4 12h16M4 18h10" /></S>
export const Scribble = (p) => <S {...p}><path d="M3 17c3-6 5-9 7-9s-1 8 2 8 3-6 5-6 1 5 4 5" /></S>
export const Undo = (p) => <S {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></S>
