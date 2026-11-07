import { useEffect, useState } from 'react'

import { TRANSITION_FPS, TRANSITION_MS } from './screen-fade'

// How long after its end a switch is finished by a timer, in milliseconds
const FINISH_GRACE_MS = 120

// Where the switch between the portrait and screen 2 is: `t` from 0
// (the portrait) to 1 (screen 2), moving toward `open` over
// TRANSITION_MS, and the frame it is on. It steps at TRANSITION_FPS, and
// draws nothing while it rests. With reduced motion it jumps.
//
// `t` follows the real time since the switch started, not a sum of frames,
// and a timer finishes the switch at its end: Safari on a phone can stop
// sending animation frames for a while (fast taps), and a switch that
// moved only with them stopped halfway, with both its buttons inert.
export const useScreenTransition = (
  open: boolean,
): { t: number; frame: number } => {
  const [state, setState] = useState({ t: open ? 1 : 0, frame: 0 })
  useEffect(() => {
    const target = open ? 1 : 0
    const from = state.t
    if (from === target) return
    const still =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    // A switch turned back halfway takes only the time of the way back
    const duration = still ? 0 : Math.abs(target - from) * TRANSITION_MS
    const start = performance.now()
    let frame = state.frame
    let lastFrame = -Infinity
    let done = false
    let raf = 0
    const tAt = (now: number) =>
      duration === 0
        ? target
        : from + (target - from) * Math.min(1, (now - start) / duration)
    const finish = () => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      frame += 1
      setState({ t: target, frame })
    }
    const tick = (now: number) => {
      const t = tAt(now)
      if (t === target) return finish()
      if (now - lastFrame >= 1000 / TRANSITION_FPS - 1) {
        lastFrame = now
        frame += 1
        setState({ t, frame })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const timer = setTimeout(finish, duration + FINISH_GRACE_MS)
    return () => {
      done = true
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
    // Only a new target starts it; `state` is where it starts from
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return state
}
