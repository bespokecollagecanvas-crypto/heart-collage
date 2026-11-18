// Where was this taken? GPS from the phone, then a readable place name.

export function getPosition(timeout = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    )
  })
}

const cache = new Map()

export async function placeName(lat, lng) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  if (cache.has(key)) return cache.get(key)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )
    const j = await res.json()
    const SHORT = { GB: 'UK', US: 'USA', AE: 'UAE' }
    const country = SHORT[j.countryCode] || (j.countryName || '').replace(/\s*\(the\)$/i, '')
    const parts = [j.city || j.locality, country]
    const name = [...new Set(parts.filter(Boolean))].join(', ') || null
    cache.set(key, name)
    return name
  } catch {
    return null
  }
}

/** Position plus place name; never throws, returns nulls if unavailable. */
export async function locate() {
  const pos = await getPosition()
  if (!pos) return { lat: null, lng: null, placeName: null }
  return { ...pos, placeName: await placeName(pos.lat, pos.lng) }
}
