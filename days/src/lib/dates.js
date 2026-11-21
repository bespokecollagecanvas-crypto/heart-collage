const pad = (n) => String(n).padStart(2, '0')

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** A local calendar day as "YYYY-MM-DD". */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "YYYY-MM-DD" -> Date at local midnight. */
export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export const monthKey = (year, month) => `${year}-${pad(month + 1)}`

export function parseMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function shiftMonth(key, n) {
  const { year, month } = parseMonth(key)
  const d = new Date(year, month + n, 1)
  return monthKey(d.getFullYear(), d.getMonth())
}

export function monthRange(year, month) {
  const last = new Date(year, month + 1, 0).getDate()
  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(last)}` }
}

/** Weeks of a month, Monday first. Cells outside the month are null. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`)
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const clock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export function longDate(key) {
  const d = parseDay(key)
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function shortDate(key) {
  const d = parseDay(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** Fraction of the day passed at this moment, 0..1. */
export const dayFraction = (d) => (d.getHours() * 60 + d.getMinutes()) / 1440
