import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'
import { addDays, dayKey } from './dates'
import { countByDay, streakFrom } from './streak'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still checking
  const [profile, setProfile] = useState(null)
  const [version, setVersion] = useState(0) // bumps whenever captures change
  const [counts, setCounts] = useState({}) // my captures per day, last ~13 months
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.auth.getUser().then(setUser)
    return api.auth.onChange(setUser)
  }, [])

  useEffect(() => {
    if (!user) return setProfile(null)
    let alive = true
    const load = async (tries = 0) => {
      try {
        const p = await api.profiles.me()
        if (alive) setProfile(p)
      } catch (e) {
        // A brand-new account's profile can take a moment to appear.
        if (tries < 4) setTimeout(() => load(tries + 1), 800)
        else if (alive) setToast(e.message)
      }
    }
    load()
    return () => (alive = false)
  }, [user])

  useEffect(() => {
    if (!profile) return
    api.captures
      .days(profile.id, addDays(dayKey(), -400), addDays(dayKey(), 1))
      .then((rows) => setCounts(countByDay(rows)))
      .catch(() => {})
  }, [profile?.id, version])

  const theme = profile?.theme || localStorage.getItem('days-theme') || 'playful'
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('days-theme', theme)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'chic' ? '#1b1a19' : '#ffffff')
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const updateProfile = useCallback(async (patch) => {
    setProfile((p) => ({ ...p, ...patch }))
    try {
      setProfile(await api.profiles.update(patch))
    } catch (e) {
      setToast(e.message)
      setProfile(await api.profiles.me())
    }
  }, [])

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const value = {
    user, profile, updateProfile, version, bump, counts, theme,
    streak: streakFrom(counts, profile?.daily_min ?? 1),
    todayCount: counts[dayKey()] || 0,
    toast, setToast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Captures for a user between two days; refetches when captures change. */
export function useCaptures(userId, from, to) {
  const { version } = useApp()
  const [state, setState] = useState({ captures: [], loading: true })
  useEffect(() => {
    if (!userId) return
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    api.captures
      .range(userId, from, to)
      .then((captures) => alive && setState({ captures, loading: false }))
      .catch(() => alive && setState({ captures: [], loading: false }))
    return () => (alive = false)
  }, [userId, from, to, version])
  return state
}

/** A profile by username (instant for your own). */
export function useProfile(username) {
  const { profile } = useApp()
  const mine = profile && profile.username === username
  const [other, setOther] = useState(undefined)
  useEffect(() => {
    if (mine || !username) return
    setOther(undefined)
    api.profiles.byUsername(username).then(setOther).catch(() => setOther(null))
  }, [username, mine])
  return { person: mine ? profile : other, mine }
}
