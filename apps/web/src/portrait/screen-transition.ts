import { useEffect, useState } from 'react'

import { TRANSITION_FPS, TRANSITION_MS } from './screen-fade'

// Where the switch between the portrait and screen 2 is: `t` from 0
// (the portrait) to 1 (screen 2), moving toward `open` over
// TRANSITION_MS, and the frame it is on. It steps at TRANSITION_FPS, and
// draws nothing while it rests. With reduced motion it jumps.
export const useScreenTransition = (
  open: boolean,
): { t: number; frame: number } => {
  const [state, setState] = useState({ t: open ? 1 : 0, frame: 0 })
  useEffect(() => {
    const target = open ? 1 : 0
    const still =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last: number | null = null
    let lastFrame = -Infinity
    let { t, frame } = state
    const tick = (now: number) => {
      const step = (now - (last ?? now)) / TRANSITION_MS
      t = still
        ? target
        : target > t
          ? Math.min(target, t + step)
          : Math.max(target, t - step)
      last = now
      if (t === target || now - lastFrame >= 1000 / TRANSITION_FPS - 1) {
        lastFrame = now
        frame += 1
        setState({ t, frame })
      }
      if (t !== target) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // Only a new target starts it; `state` is where it starts from
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return state
}
