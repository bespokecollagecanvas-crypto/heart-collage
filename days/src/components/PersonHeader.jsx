import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Avatar from './Avatar'

/** Name, counts and follow button when viewing someone else's calendar. */
export default function PersonHeader({ person }) {
  const [following, setFollowing] = useState(null)
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    api.follows.isFollowing(person.id).then(setFollowing).catch(() => {})
    api.follows.counts(person.id).then(setCounts).catch(() => {})
  }, [person.id])
  async function toggle() {
    const was = following
    setFollowing(!was)
    try {
      await (was ? api.follows.unfollow(person.id) : api.follows.follow(person.id))
      setCounts(await api.follows.counts(person.id))
    } catch {
      setFollowing(was)
    }
  }
  return (
    <div className="person-head">
      <Avatar person={person} size={44} />
      <div className="grow">
        <strong>{person.name}</strong>
        <span>@{person.username}{counts && ` · ${counts.followers} followers`}</span>
      </div>
      {following !== null && (
        <button className={`btn small ${following ? 'ghost' : 'primary'}`} onClick={toggle}>{following ? 'Following' : 'Follow'}</button>
      )}
    </div>
  )
}
