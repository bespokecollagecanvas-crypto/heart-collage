// Helpers for camera, recording and image resizing.

export function pickMime(kind) {
  const options =
    kind === 'video'
      ? ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
  if (typeof MediaRecorder === 'undefined') return null
  return options.find((m) => MediaRecorder.isTypeSupported?.(m)) || ''
}

export function extFor(mime = '') {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('png')) return 'png'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('quicktime')) return 'mov'
  return 'jpg'
}

const toBlob = (canvas, q = 0.88) => new Promise((r) => canvas.toBlob(r, 'image/jpeg', q))

/** Grab the current frame of a <video> element as a full-size JPEG. */
export async function frameToBlob(video, mirror = false) {
  const c = document.createElement('canvas')
  c.width = video.videoWidth
  c.height = video.videoHeight
  const ctx = c.getContext('2d')
  if (mirror) {
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0)
  return toBlob(c, 0.9)
}

/** Small square-ish preview used in the calendar grids. */
export async function makeThumb(source, max = 360) {
  let img = source
  if (source instanceof Blob) img = await loadImage(source)
  const w = img.videoWidth || img.naturalWidth || img.width
  const h = img.videoHeight || img.naturalHeight || img.height
  if (!w || !h) return null
  const scale = Math.min(1, max / Math.min(w, h))
  const c = document.createElement('canvas')
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return toBlob(c, 0.8)
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/** First frame of a recorded video, as a thumbnail. */
export function videoThumb(blob) {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.src = URL.createObjectURL(blob)
    const done = async () => resolve(await makeThumb(v).catch(() => null))
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.1, (v.duration || 1) / 2)
    }
    v.onseeked = done
    v.onerror = () => resolve(null)
    setTimeout(() => resolve(null), 4000)
  })
}
