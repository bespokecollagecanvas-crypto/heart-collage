import { addDays, dayKey } from './dates'

/** Count captures per day: { 'YYYY-MM-DD': n } (imported captures don't count). */
export function countByDay(captures) {
  const out = {}
  for (const c of captures) if (!c.imported) out[c.day] = (out[c.day] || 0) + 1
  return out
}

/**
 * Consecutive days logged (meeting the daily minimum), ending today.
 * If today isn't logged yet the streak still stands from yesterday.
 */
export function streakFrom(counts, min = 1) {
  const ok = (k) => (counts[k] || 0) >= min
  let k = dayKey()
  if (!ok(k)) k = addDays(k, -1)
  let n = 0
  while (ok(k)) {
    n++
    k = addDays(k, -1)
  }
  return n
}
