// The switch between the portrait and screen 2: the face fades out
// (shrinking a little), the field of characters around it filling its
// place, and screen 2 fades in on that field (growing a little to
// its size). Closing plays it backwards, from wherever it is.
//
// Timed the way Apple's motion guidance asks: short, the two overlapping
// rather than one waiting for the other, the face leaving fast with an
// ease-out, and screen 2 arriving with a spring that settles without
// a bounce (critically damped), only its opacity and scale changing.

// The whole switch, and its frame rate: smooth, as nothing in it is drawn
// in characters
export const TRANSITION_MS = 520
export const TRANSITION_FPS = 60

// The face fades out until OUT_UNTIL; screen 2 comes in from
// IN_FROM to the end, so the two overlap
export const OUT_UNTIL = 0.55
export const IN_FROM = 0.3

// How much the face shrinks as it goes, and how small screen 2
// starts, as fractions of their size
export const FACE_SHRINK = 0.02
export const SCREEN_2_GROW = 0.04

const clamp = (v: number): number => Math.min(1, Math.max(0, v))

// An ease-out: fast at first, then slowing to a stop
const easeOut = (v: number): number => 1 - (1 - v) ** 3

// A critically damped spring from 0 to 1 (no bounce), scaled to land
// exactly on 1 at the end
const SPRING = 7
const spring = (v: number): number => {
  const at = (x: number) => 1 - (1 + SPRING * x) * Math.exp(-SPRING * x)
  return at(v) / at(1)
}

// How far the face has faded out (0 to 1) at `t` of the switch
export const coverAt = (t: number): number => easeOut(clamp(t / OUT_UNTIL))

// How far screen 2 has come in (0 to 1) at `t`
export const textAt = (t: number): number =>
  spring(clamp((t - IN_FROM) / (1 - IN_FROM)))

// How far the lines of screen 2 have grown (0 to 1) at `t`: from
// LINE_FROM, out of the edges of the screen toward the name, slowing as they
// arrive; closing, they shrink back to the edges
export const LINE_FROM = 0.35
export const lineAt = (t: number): number =>
  easeOut(clamp((t - LINE_FROM) / (1 - LINE_FROM)))
