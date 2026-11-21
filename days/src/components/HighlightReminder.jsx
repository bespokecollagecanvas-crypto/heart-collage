import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/api'
import { addDays, dayKey } from '../lib/dates'
import HighlightSheet from './HighlightSheet'

const ASKED = 'days-highlight-asked' // the day we last asked about
const SNOOZE = 'days-highlight-snooze' // time before which "Later" keeps us quiet

const get = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const set = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* reminder state is a convenience only */
  }
}

/**
 * The day after, from the person's chosen time, ask for yesterday's highlight
 * (once; "Later" asks again in two hours). Shown whenever Days is open.
 */
export default function HighlightReminder() {
  const { profile } = useApp()
  const [ask, setAsk] = useState(null)

  useEffect(() => {
    const time = profile?.highlight_time
    if (!profile || !time) return
    let alive = true
    async function check() {
      const now = new Date()
      const [h, m] = time.split(':').map(Number)
      if (now.getHours() * 60 + now.getMinutes() < h * 60 + (m || 0)) return
      const y = addDays(dayKey(), -1)
      if (get(ASKED) === y) return
      if (Number(get(SNOOZE) || 0) > Date.now()) return
      if (profile.created_at && dayKey(new Date(profile.created_at)) > y) return
      const rows = await api.days.range(profile.id, y, y).catch(() => [])
      if (alive && !rows.length) setAsk(y)
    }
    check()
    const t = setInterval(check, 60000)
    const vis = () => !document.hidden && check()
    document.addEventListener('visibilitychange', vis)
    return () => {
      alive = false
      clearInterval(t)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [profile?.id, profile?.highlight_time])

  if (!ask) return null
  return (
    <HighlightSheet
      day={ask}
      asking
      onClose={() => {
        set(ASKED, ask)
        setAsk(null)
      }}
      onLater={() => {
        set(SNOOZE, String(Date.now() + 2 * 60 * 60 * 1000))
        setAsk(null)
      }}
    />
  )
}
