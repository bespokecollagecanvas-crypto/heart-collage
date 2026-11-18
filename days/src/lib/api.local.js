// Demo mode: everything is stored on this device only (no account server).
import { idb } from './idb'

const SESSION = 'days-demo-session'
const urls = new Map()
const listeners = new Set()

async function blobUrl(key) {
  if (!key) return null
  if (urls.has(key)) return urls.get(key)
  const blob = await idb.get('blobs', key)
  if (!blob) return null
  const u = URL.createObjectURL(blob)
  urls.set(key, u)
  return u
}

async function hydrate(c) {
  return {
    ...c,
    is_public: c.is_public ?? (c.type === 'photo' || c.type === 'video'),
    media_url: await blobUrl(c.media_key),
    thumb_url: await blobUrl(c.thumb_key),
    voice_note_url: await blobUrl(c.voice_key),
  }
}

const emit = (u) => listeners.forEach((cb) => cb(u))

async function currentUser() {
  if (!localStorage.getItem(SESSION)) return null
  const p = await idb.get('kv', 'profile')
  return p ? { id: p.id, email: p.email } : null
}

export function createLocalApi() {
  return {
    mode: 'local',
    auth: {
      getUser: currentUser,
      onChange(cb) {
        listeners.add(cb)
        return () => listeners.delete(cb)
      },
      async signUp({ email, name }) {
        const existing = await idb.get('kv', 'profile')
        const base = (name || 'me').toLowerCase().replace(/[^a-z0-9]/g, '') || 'me'
        const profile = existing || {
          id: crypto.randomUUID(), email, name, username: base, avatar_url: null,
          theme: 'stone', daily_min: 1, daily_max: 10, created_at: new Date().toISOString(),
        }
        await idb.put('kv', profile, 'profile')
        localStorage.setItem(SESSION, '1')
        emit(await currentUser())
        return { needsConfirm: false }
      },
      async signIn({ email }) {
        const p = await idb.get('kv', 'profile')
        if (!p) throw new Error('No demo account on this phone yet. Tap “Create account”.')
        if (p.email.toLowerCase() !== email.toLowerCase()) throw new Error('That email doesn’t match the demo account on this phone.')
        localStorage.setItem(SESSION, '1')
        emit(await currentUser())
      },
      async signInWithProvider() {
        throw new Error('Google and Facebook sign-in work once Supabase is connected (see SETUP.md).')
      },
      async signOut() {
        localStorage.removeItem(SESSION)
        emit(null)
      },
    },
    profiles: {
      me: () => idb.get('kv', 'profile'),
      async update(patch) {
        const p = { ...(await idb.get('kv', 'profile')), ...patch }
        await idb.put('kv', p, 'profile')
        return p
      },
      async byUsername(u) {
        const p = await idb.get('kv', 'profile')
        return p?.username === u ? p : null
      },
      async search() {
        return []
      },
    },
    captures: {
      async create({ file, thumb, type, takenAt, day, lat, lng, placeName, comment, voiceNote, body, isPublic }) {
        const me = await idb.get('kv', 'profile')
        const today = await idb.rangeByDay(day, day)
        if (today.filter((c) => !c.imported).length >= (me.daily_max || 10)) throw new Error('You have reached today’s limit.')
        const id = crypto.randomUUID()
        if (file) await idb.put('blobs', file, `${id}:media`)
        if (thumb) await idb.put('blobs', thumb, `${id}:thumb`)
        if (voiceNote) await idb.put('blobs', voiceNote, `${id}:voice`)
        const row = {
          id, user_id: me.id, type, day, taken_at: takenAt.toISOString(),
          latitude: lat, longitude: lng, place_name: placeName, comment: comment || null, body: body || null, is_public: isPublic ?? (type === 'photo' || type === 'video'), imported: false,
          media_key: file ? `${id}:media` : null, thumb_key: thumb ? `${id}:thumb` : null, voice_key: voiceNote ? `${id}:voice` : null,
          created_at: new Date().toISOString(),
        }
        await idb.put('captures', row)
        return hydrate(row)
      },
      async range(_userId, from, to) {
        const rows = await idb.rangeByDay(from, to)
        rows.sort((a, b) => a.taken_at.localeCompare(b.taken_at))
        return Promise.all(rows.map(hydrate))
      },
      async days(_userId, from, to) {
        return idb.rangeByDay(from, to)
      },
      async update(id, patch) {
        const all = await idb.rangeByDay('0000-01-01', '9999-12-31')
        const row = { ...all.find((c) => c.id === id), ...patch }
        await idb.put('captures', row)
        return hydrate(row)
      },
      async remove(c) {
        await idb.del('captures', c.id)
        for (const k of [c.media_key, c.thumb_key, c.voice_key]) if (k) await idb.del('blobs', k)
      },
    },
    follows: {
      follow: async () => {},
      unfollow: async () => {},
      isFollowing: async () => false,
      following: async () => [],
      counts: async () => ({ followers: 0, following: 0 }),
    },
  }
}
