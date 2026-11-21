// Little line icons that mark what a day meant. Same 24px grid and stroke as the rest of the app.
const S = ({ children, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
)

export const DAY_ICONS = [
  { key: 'ring', label: 'Engaged', words: ['engaged', 'engagement', 'propose', 'proposed', 'proposal', 'marry', 'ring'],
    draw: <><circle cx="12" cy="15" r="6" /><path d="M9 6l3-3 3 3-3 3z" /></> },
  { key: 'wedding', label: 'Wedding', words: ['wedding', 'married', 'got married', 'bride', 'groom', 'vows'],
    draw: <><circle cx="9" cy="14" r="5" /><circle cx="15" cy="14" r="5" /><path d="M12 4l1.5 2h-3z" /></> },
  { key: 'guitar', label: 'Gig', words: ['gig', 'concert', 'band', 'guitar', 'rock', 'live music', 'festival', 'played live', 'live at', 'saw them live', 'headline', 'mosh'],
    draw: <><path d="M13 11l7-7M18.5 3l2.5 2.5" /><path d="M10.5 9.5a4 4 0 0 0-5.6 1.2c-.8 1.2-.2 2.4-1.4 3.4-1.4 1.2-.6 3.8 1.6 4.8 2.2 1 4.8.2 5.6-1.8.6-1.4 1.8-1 2.8-2a4 4 0 0 0-3-5.6z" /><circle cx="9" cy="15" r="1.2" /></> },
  { key: 'dj', label: 'DJ / club', words: ['dj', 'club', 'clubbing', 'rave', 'techno', 'house music', 'decks', 'dance music'],
    draw: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="10" cy="12" r="4" /><circle cx="10" cy="12" r="0.8" /><path d="M17.5 7.5v6l-2 2" /></> },
  { key: 'music', label: 'Music', words: ['song', 'wrote a song', 'recorded', 'studio', 'lyrics', 'choir', 'opera'],
    draw: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></> },
  { key: 'cake', label: 'Birthday', words: ['birthday', 'bday', 'cake', 'turned', 'party'],
    draw: <><rect x="4" y="12" width="16" height="8" rx="1" /><path d="M4 15.5c2.7 1.5 5.3 1.5 8 0s5.3-1.5 8 0M8 12V9M12 12V9M16 12V9" /></> },
  { key: 'heart', label: 'Love', words: ['love', 'first date', 'date night', 'anniversary', 'valentine', 'kissed', 'met'],
    draw: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /> },
  { key: 'baby', label: 'Baby', words: ['baby', 'born', 'birth', 'pregnant', 'scan', 'newborn'],
    draw: <><circle cx="12" cy="9" r="5" /><path d="M7 21c0-3 2.2-5 5-5s5 2 5 5" /><path d="M10 9h.01M14 9h.01" /></> },
  { key: 'plane', label: 'Trip', words: ['flight', 'flew', 'holiday', 'airport', 'trip', 'abroad', 'travel', 'vacation'],
    draw: <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /> },
  { key: 'sun', label: 'Beach', words: ['beach', 'sunshine', 'summer', 'sunny', 'pool', 'swim', 'sea'],
    draw: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> },
  { key: 'mountain', label: 'Outdoors', words: ['hike', 'hiking', 'mountain', 'climb', 'walk', 'camping', 'snow', 'ski'],
    draw: <path d="M3 20l6.5-12 4 7 2-3 5.5 8z" /> },
  { key: 'food', label: 'Food', words: ['dinner', 'restaurant', 'meal', 'brunch', 'lunch', 'feast', 'cooked'],
    draw: <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10" /> },
  { key: 'ball', label: 'Sport', words: ['football', 'match', 'goal', 'stadium', 'game', 'marathon', 'race', 'gym'],
    draw: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z" /><path d="M12 3v4.5M15.5 10l5-1.5M14.2 14l3 4.5M9.8 14l-3 4.5M8.5 10l-5-1.5" /></> },
  { key: 'trophy', label: 'Win', words: ['won', 'win', 'winner', 'award', 'promotion', 'promoted', 'champion', 'first place'],
    draw: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></> },
  { key: 'grad', label: 'Graduation', words: ['graduated', 'graduation', 'exam', 'degree', 'passed', 'qualified', 'certificate'],
    draw: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v5" /></> },
  { key: 'rocket', label: 'Launch', words: ['launch', 'launched', 'created', 'started', 'new job', 'business', 'app', 'founded', 'built'],
    draw: <><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z" /><path d="M12 15l-3-3a22 22 0 0 1 2-4A13 13 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" /></> },
  { key: 'home', label: 'Home', words: ['moved', 'new house', 'new flat', 'keys', 'housewarming', 'renovation', 'moved in'],
    draw: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> },
  { key: 'paw', label: 'Pet', words: ['dog', 'puppy', 'cat', 'kitten', 'pet', 'vet'],
    draw: <><circle cx="6.5" cy="10" r="1.8" /><circle cx="10" cy="6" r="1.8" /><circle cx="14" cy="6" r="1.8" /><circle cx="17.5" cy="10" r="1.8" /><path d="M12 11c-3 0-6 4-6 6.5 0 1.5 1.2 2.5 2.7 2.2 1.2-.2 2.2-.7 3.3-.7s2.1.5 3.3.7c1.5.3 2.7-.7 2.7-2.2C18 15 15 11 12 11z" /></> },
  { key: 'star', label: 'Big day', words: ['best day', 'amazing', 'incredible', 'unforgettable', 'milestone'],
    draw: <path d="M12 2l3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.2-6.2 3.2L7 14.1 2 9.3l6.9-1z" /> },
]

const BY_KEY = Object.fromEntries(DAY_ICONS.map((i) => [i.key, i]))

export function DayIcon({ name, size = 16, ...p }) {
  const icon = BY_KEY[name]
  if (!icon) return null
  return <S size={size} aria-label={icon.label} {...p}>{icon.draw}</S>
}

/** Guess an icon from the highlight text ("asked her to marry me" -> ring). */
export function suggestIcon(text = '') {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' ]/g, ' ')} `
  let best = null
  let bestLen = 0
  for (const icon of DAY_ICONS)
    for (const w of icon.words)
      if (t.includes(` ${w}`) && w.length > bestLen) {
        best = icon.key
        bestLen = w.length
      }
  return best
}
