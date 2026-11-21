import { useEffect, useRef } from 'react'

/** Pinch in (fingers together) = zoom out; pinch out = zoom in. */
export function usePinch(ref, { onPinchIn, onPinchOut }) {
  const cb = useRef({ onPinchIn, onPinchOut })
  cb.current = { onPinchIn, onPinchOut }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start = 0
    let last = 0
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const ts = (e) => {
      if (e.touches.length === 2) start = last = dist(e.touches)
    }
    const tm = (e) => {
      if (e.touches.length === 2 && start) {
        last = dist(e.touches)
        e.preventDefault()
      }
    }
    const te = () => {
      if (!start) return
      const r = last / start
      start = 0
      if (r < 0.75) cb.current.onPinchIn?.()
      else if (r > 1.33) cb.current.onPinchOut?.()
    }
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchmove', tm, { passive: false })
    el.addEventListener('touchend', te)
    return () => {
      el.removeEventListener('touchstart', ts)
      el.removeEventListener('touchmove', tm)
      el.removeEventListener('touchend', te)
    }
  }, [ref])
}

/** Horizontal swipe detection for simple left/right paging. */
export function useSwipe({ onLeft, onRight, threshold = 50 }) {
  const s = useRef(null)
  return {
    onTouchStart: (e) => {
      if (e.touches.length === 1) s.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      else s.current = null
    },
    onTouchEnd: (e) => {
      if (!s.current) return
      const dx = e.changedTouches[0].clientX - s.current.x
      const dy = e.changedTouches[0].clientY - s.current.y
      s.current = null
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onLeft : onRight)?.()
    },
  }
}
