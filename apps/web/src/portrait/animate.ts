// The motion of the portrait, as pure functions of the clock, so a frame
// clock can sample it at any frame rate. Every change to the drawing is a
// pre-drawn frame, like a sprite (see "Animation" in doc/code-convention.md):
// the frames are made by the design tools of the portrait.

// Breathing: a slow rise of 2px and back, every 11 seconds
export const BREATH_SECONDS = 11
export const breathOffset = (t: number): number =>
  -(1 - Math.cos((2 * Math.PI * t) / BREATH_SECONDS))

// The hair in the wind: HAIR_FRAMES drawings of the top HAIR_ROWS rows (made
// by tools/hair-frames.mjs), played in a loop
export const HAIR_FRAMES = 24
export const HAIR_ROWS = 57
export const HAIR_LOOP_SECONDS = 3

// The hair frame to show at time t (seconds)
export const hairFrameAt = (t: number): number =>
  Math.floor((t / HAIR_LOOP_SECONDS) * HAIR_FRAMES) % HAIR_FRAMES

// The eyes: drawings of the EYE_ROWS rows from EYE_FROM (made by
// tools/eye-frames.mjs). First the normal eyes blinking, EYE_BLINKS frames
// from open to shut; then the red eye, drawn turned EYE_SPINS times through
// a third of a turn (after which its three tomoe look the same again), with
// the same blink for each turn; last, EYE_RISE frames of the red eye
// turning on in the open eye (the red fading in over the dark eye, the
// tomoe growing out of the pupil), drawn at every turn and played backwards
// to turn it off, so it can turn off wherever it is in its spin. The eye
// rows always show these frames, so nothing swaps the image behind them.
export const EYE_SPINS = 12
export const EYE_BLINKS = 7
export const EYE_RISE = 6
export const EYE_FRAMES = EYE_BLINKS * (1 + EYE_SPINS) + EYE_SPINS * EYE_RISE
export const EYE_SHUT = EYE_BLINKS - 1
export const EYE_FROM = 60
export const EYE_ROWS = 10

// The red eye turns a third of a turn every SPIN_SECONDS
export const SPIN_SECONDS = 2

// The turn of the red eye at time t (seconds)
export const spinFrameAt = (t: number): number =>
  Math.floor((t / SPIN_SECONDS) * EYE_SPINS) % EYE_SPINS

// What the eyes show: normal eyes or the red eye at a turn, each at a
// frame of the blink, or a step of the red eye turning on (or off) at a turn
export type EyeState =
  | { kind: 'normal'; blink: number }
  | { kind: 'redEye'; spin: number; blink: number }
  | { kind: 'rise'; spin: number; step: number }

export const eyeFrame = (eyes: EyeState): number => {
  switch (eyes.kind) {
    case 'normal':
      return eyes.blink
    case 'redEye':
      return EYE_BLINKS + eyes.spin * EYE_BLINKS + eyes.blink
    case 'rise':
      return EYE_BLINKS * (1 + EYE_SPINS) + eyes.spin * EYE_RISE + eyes.step
  }
}

// Turning on takes EYE_RISE steps of RISE_STEP_MS; turning off the same,
// backwards
export const RISE_STEP_MS = 80

// The step `elapsed` ms into turning on (0 first), or null once it is on
export const riseStepAt = (elapsed: number): number | null => {
  const step = Math.floor(elapsed / RISE_STEP_MS)
  return step < EYE_RISE ? step : null
}

// The step `elapsed` ms into turning off (the last step first), or null once
// it is off
export const fallStepAt = (elapsed: number): number | null => {
  const step = riseStepAt(elapsed)
  return step === null ? null : EYE_RISE - 1 - step
}

// A human blink: the lids close fast, speeding up, stay shut a moment, and
// open more slowly, easing out. The shut frame lasts at least one frame of
// the clock, so a low frame rate never skips it.
const CLOSING_MS = 90
const SHUT_MS = 50
const OPENING_MS = 200

// How far closed the eyes are, 0 to 1, `elapsed` ms into a blink, or null
// once it is over
export const blinkAmountAt = (
  elapsed: number,
  frameMs: number,
): number | null => {
  if (elapsed < CLOSING_MS) return (elapsed / CLOSING_MS) ** 2
  const shut = Math.max(SHUT_MS, frameMs)
  const opening = elapsed - CLOSING_MS - shut
  if (opening < 0) return 1
  if (opening >= OPENING_MS) return null
  const u = opening / OPENING_MS
  return (1 - u) ** 2
}

// The eye frame `elapsed` ms into a blink, or null once it is over
export const blinkFrameAt = (
  elapsed: number,
  frameMs: number,
): number | null => {
  const amount = blinkAmountAt(elapsed, frameMs)
  return amount === null ? null : Math.round(amount * EYE_SHUT)
}
