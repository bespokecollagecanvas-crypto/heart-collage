import { createClient } from '@supabase/supabase-js'
import { extFor } from './media'

export function createSupabaseApi(url, key) {
  const sb = createClient(url, key)
  const BUCKET = 'media'
  const toUser = (u) => (u ? { id: u.id, email: u.email } : null)
  const uid = async () => (await sb.auth.getSession()).data.session?.user?.id
  const check = ({ data, error }) => {
    if (error) throw new Error(error.message)
    return data
  }

  async function upload(path, blob) {
    check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || undefined, upsert: false }))
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }
  const pathOf = (u) => (u ? decodeURIComponent(u.split(`/object/public/${BUCKET}/`)[1] || '') : null)

  const clean = (q) => q.replace(/[,()%*\\]/g, ' ').trim()

  return {
    mode: 'supabase',
    auth: {
      async getUser() {
        return toUser((await sb.auth.getSession()).data.session?.user)
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toUser(s?.user)))
        return () => data.subscription.unsubscribe()
      },
      async signUp({ email, password, name }) {
        const data = check(
          await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin } })
        )
        return { needsConfirm: !data.session }
      },
      async signIn({ email, password }) {
        check(await sb.auth.signInWithPassword({ email, password }))
      },
      async signInWithProvider(provider) {
        check(await sb.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } }))
      },
      async signOut() {
        await sb.auth.signOut()
      },
    },
    profiles: {
      async me() {
        const id = await uid()
        if (!id) return null
        return check(await sb.from('profiles').select('*').eq('id', id).single())
      },
      async update(patch) {
        const id = await uid()
        return check(await sb.from('profiles').update(patch).eq('id', id).select().single())
      },
      async byUsername(username) {
        return check(await sb.from('profiles').select('*').eq('username', username).maybeSingle())
      },
      async search(q) {
        const s = clean(q)
        let query = sb.from('profiles').select('*').order('name').limit(30)
        if (s) query = query.or(`username.ilike.%${s}%,name.ilike.%${s}%`)
        return check(await query)
      },
    },
    captures: {
      async create({ file, thumb, type, takenAt, day, lat, lng, placeName, comment, voiceNote, body, isPublic }) {
        const id = crypto.randomUUID()
        const user = await uid()
        const media_url = file ? await upload(`${user}/${id}.${extFor(file.type)}`, file) : null
        const thumb_url = thumb ? await upload(`${user}/${id}_thumb.jpg`, thumb) : null
        const voice_note_url = voiceNote ? await upload(`${user}/${id}_voice.${extFor(voiceNote.type)}`, voiceNote) : null
        const row = {
          id, user_id: user, type, media_url, thumb_url, voice_note_url,
          taken_at: takenAt.toISOString(), day,
          latitude: lat, longitude: lng, place_name: placeName,
          comment: comment || null, body: body || null, is_public: isPublic ?? (type === 'photo' || type === 'video'), imported: false,
        }
        const res = await sb.from('captures').insert(row).select().single()
        if (res.error) {
          await sb.storage.from(BUCKET).remove([media_url, thumb_url, voice_note_url].map(pathOf).filter(Boolean))
          throw new Error(res.error.message)
        }
        return res.data
      },
      async range(userId, from, to) {
        return check(
          await sb.from('captures').select('*').eq('user_id', userId).gte('day', from).lte('day', to).order('taken_at')
        )
      },
      async days(userId, from, to) {
        return check(await sb.from('captures').select('day, imported').eq('user_id', userId).gte('day', from).lte('day', to))
      },
      async update(id, patch) {
        return check(await sb.from('captures').update(patch).eq('id', id).select().single())
      },
      async remove(c) {
        check(await sb.from('captures').delete().eq('id', c.id))
        await sb.storage.from(BUCKET).remove([c.media_url, c.thumb_url, c.voice_note_url].map(pathOf).filter(Boolean))
      },
    },
    follows: {
      async follow(id) {
        check(await sb.from('follows').insert({ follower_id: await uid(), following_id: id }))
      },
      async unfollow(id) {
        check(await sb.from('follows').delete().eq('follower_id', await uid()).eq('following_id', id))
      },
      async isFollowing(id) {
        const r = check(await sb.from('follows').select('following_id').eq('follower_id', await uid()).eq('following_id', id))
        return r.length > 0
      },
      async following() {
        const rows = check(await sb.from('follows').select('profiles!follows_following_id_fkey(*)').eq('follower_id', await uid()))
        return rows.map((r) => r.profiles).filter(Boolean)
      },
      async counts(id) {
        const a = await sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id)
        const b = await sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id)
        return { followers: a.count || 0, following: b.count || 0 }
      },
    },
  }
}
