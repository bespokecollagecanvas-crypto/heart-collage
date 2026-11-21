export default function Avatar({ person, size }) {
  const style = size ? { width: size, height: size, fontSize: size * 0.42 } : undefined
  if (person?.avatar_url) return <img className="avatar" style={style} src={person.avatar_url} alt="" />
  const initial = (person?.name || person?.username || '•').trim().charAt(0).toUpperCase()
  return <span className="avatar" style={style}>{initial}</span>
}
