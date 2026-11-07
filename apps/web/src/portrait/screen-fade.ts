import { type CSSProperties } from 'react'

// The switch between the portrait and screen 2: the face fades out
// (shrinking a little), the field of characters around it filling its
// place, and screen 2 fades in on that field (growing a little to
// its size). Closing plays it backwards.
//
// Timed the way Apple's motion guidance asks: short, the two overlapping
// rather than one waiting for the other, the face leaving fast with an
// ease-out, and screen 2 arriving with a spring that settles without
// a bounce (critically damped), only its opacity and scale changing.
//
// Each part is a CSS transition, as in tea-cup-drawer: the browser runs it
// on its own, with no script per frame, so a busy page (fast taps on a
// phone) cannot stop it halfway. The model only knows the phase of the
// switch (`ScreenState` in type.ts) and settles it when the last part ends.

// The whole switch, in milliseconds
export const TRANSITION_MS = 520

// The face fades out until OUT_UNTIL of the switch; screen 2 comes in
// from IN_FROM to the end, so the two overlap; its lines grow from LINE_FROM
export const OUT_UNTIL = 0.55
export const IN_FROM = 0.3
export const LINE_FROM = 0.35

// How much the face shrinks as it goes, and how small screen 2
// starts, as fractions of their size
export const FACE_SHRINK = 0.02
export const SCREEN_2_GROW = 0.04

// A critically damped spring from 0 to 1 (no bounce), scaled to land
// exactly on 1 at the end
const SPRING = 7
export const spring = (v: number): number => {
  const at = (x: number) => 1 - (1 + SPRING * x) * Math.exp(-SPRING * x)
  return at(v) / at(1)
}

// A curve as a CSS linear() easing, sampled at `steps` points
export const linearEasing = (curve: (v: number) => number, steps = 24) =>
  `linear(${Array.from({ length: steps + 1 }, (_, i) => curve(i / steps).toFixed(4)).join(', ')})`

// The easings, and their mirror images for closing (a curve played
// backwards in time is 1 - curve(1 - v)). A browser without linear() drops
// the spring and eases the default way.
const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)'
const EASE_IN = 'cubic-bezier(0.32, 0, 0.67, 0)'
const SPRING_IN = linearEasing(spring)
const SPRING_OUT = linearEasing((v) => 1 - spring(1 - v))

// The parts of the switch: the face (and the field filling its place),
// screen 2 (its fade and its growth), and the lines of screen 2
export type FadePart = 'face' | 'screen' | 'lines'

// Opening goes to screen 2, closing back to the portrait
export type Direction = 'opening' | 'closing'

interface Timing {
  from: number
  to: number
  easing: string
  easingBack: string
}

const TIMINGS: Record<FadePart, Timing> = {
  face: { from: 0, to: OUT_UNTIL, easing: EASE_OUT, easingBack: EASE_IN },
  screen: { from: IN_FROM, to: 1, easing: SPRING_IN, easingBack: SPRING_OUT },
  lines: { from: LINE_FROM, to: 1, easing: EASE_OUT, easingBack: EASE_IN },
}

// When a part runs, in milliseconds: opening, from `from` to `to` of the
// switch; closing, the same window mirrored in time
export const partWindow = (
  part: FadePart,
  direction: Direction,
): { delay: number; duration: number; easing: string } => {
  const { from, to, easing, easingBack } = TIMINGS[part]
  const start = direction === 'opening' ? from : 1 - to
  return {
    delay: Math.round(start * TRANSITION_MS),
    duration: Math.round((to - from) * TRANSITION_MS),
    easing: direction === 'opening' ? easing : easingBack,
  }
}

// The transition of a part, for `properties` (e.g. 'opacity, scale'); with
// reduced motion it jumps
export const fadeTransition = (
  part: FadePart,
  direction: Direction,
  properties: string,
  still: boolean,
): CSSProperties => {
  const { delay, duration, easing } = partWindow(part, direction)
  return {
    transitionProperty: properties,
    transitionDuration: still ? '0ms' : `${duration}ms`,
    transitionDelay: still ? '0ms' : `${delay}ms`,
    transitionTimingFunction: easing,
  }
}

// A layer that fades in with a part and out with it, hidden once it has
// faded out (so a faded layer costs nothing to draw)
export const fadeLayerStyle = (
  shown: boolean,
  part: FadePart,
  direction: Direction,
  still: boolean,
): CSSProperties => {
  const { delay, duration, easing } = partWindow(part, direction)
  const [d, wait] = still ? [0, 0] : [duration, delay]
  return {
    opacity: shown ? 1 : 0,
    visibility: shown ? 'visible' : 'hidden',
    transitionProperty: 'opacity, visibility',
    transitionDuration: `${d}ms, 0ms`,
    transitionDelay: `${wait}ms, ${shown ? 0 : wait + d}ms`,
    transitionTimingFunction: easing,
  }
}

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches
