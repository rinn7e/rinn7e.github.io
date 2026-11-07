import { describe, expect, it } from 'vitest'

import {
  BREATH_SECONDS,
  EYE_BLINKS,
  EYE_FRAMES,
  EYE_RISE,
  EYE_SHUT,
  EYE_SPINS,
  HAIR_FRAMES,
  HAIR_LOOP_SECONDS,
  RISE_STEP_MS,
  SPIN_SECONDS,
  blinkFrameAt,
  breathOffset,
  eyeFrame,
  fallStepAt,
  hairFrameAt,
  riseStepAt,
  spinFrameAt,
} from '../src/portrait/animate'

describe('motion over time', () => {
  it('breathes between 0 and 2px up, and back', () => {
    expect(breathOffset(0)).toBeCloseTo(0)
    expect(breathOffset(BREATH_SECONDS / 2)).toBeCloseTo(-2)
    expect(breathOffset(BREATH_SECONDS)).toBeCloseTo(0)
  })

  it('plays every hair frame once per loop, then starts over', () => {
    const step = HAIR_LOOP_SECONDS / HAIR_FRAMES
    const frames = Array.from({ length: HAIR_FRAMES }, (_, k) =>
      hairFrameAt((k + 0.5) * step),
    )
    expect(frames).toEqual(Array.from({ length: HAIR_FRAMES }, (_, k) => k))
    expect(hairFrameAt(HAIR_LOOP_SECONDS + 0.5 * step)).toBe(0)
  })
})

describe('blinkFrameAt', () => {
  // The frames a blink shows when sampled every `frameMs`
  const playedAt = (frameMs: number) => {
    const shown: number[] = []
    for (let t = 0; ; t += frameMs) {
      const frame = blinkFrameAt(t, frameMs)
      if (frame === null) return shown
      shown.push(frame)
    }
  }

  it('closes through every frame, then opens back through them', () => {
    const shown = playedAt(1)
    const distinct = shown.filter((f, i) => f !== shown[i - 1])
    expect(distinct).toEqual([0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0])
  })

  it('closes faster than it opens', () => {
    const shown = playedAt(1)
    const shut = shown.indexOf(EYE_SHUT)
    const lastShut = shown.lastIndexOf(EYE_SHUT)
    expect(shut).toBeLessThan(shown.length - 1 - lastShut)
  })

  it('never skips the shut frame at a low frame rate', () => {
    for (const fps of [2, 5, 10, 30]) {
      expect(playedAt(1000 / fps)).toContain(EYE_SHUT)
    }
  })

  it('is over in about a third of a second', () => {
    expect(playedAt(1).length).toBeLessThanOrEqual(345)
  })
})

describe('the red eye', () => {
  it('turns through every drawing once per third of a turn, then starts over', () => {
    const step = SPIN_SECONDS / EYE_SPINS
    const spins = Array.from({ length: EYE_SPINS }, (_, k) =>
      spinFrameAt((k + 0.5) * step),
    )
    expect(spins).toEqual(Array.from({ length: EYE_SPINS }, (_, k) => k))
    expect(spinFrameAt(SPIN_SECONDS + 0.5 * step)).toBe(0)
  })

  it('finds a drawing for every state of the eyes, each its own', () => {
    const frames = new Set<number>()
    for (let blink = 0; blink < EYE_BLINKS; blink++) {
      frames.add(eyeFrame({ kind: 'normal', blink }))
      for (let spin = 0; spin < EYE_SPINS; spin++) {
        frames.add(eyeFrame({ kind: 'redEye', spin, blink }))
      }
    }
    for (let spin = 0; spin < EYE_SPINS; spin++) {
      for (let step = 0; step < EYE_RISE; step++) {
        frames.add(eyeFrame({ kind: 'rise', spin, step }))
      }
    }
    expect(frames.size).toBe(EYE_FRAMES)
    expect(Math.max(...frames)).toBe(EYE_FRAMES - 1)
  })

  it('turns on through every step, and off through them backwards', () => {
    const on = [0, 1, 2, 3, 4, 5, 6].map((k) => riseStepAt(k * RISE_STEP_MS))
    const off = [0, 1, 2, 3, 4, 5, 6].map((k) => fallStepAt(k * RISE_STEP_MS))
    expect(on).toEqual([0, 1, 2, 3, 4, 5, null])
    expect(off).toEqual([5, 4, 3, 2, 1, 0, null])
    expect(EYE_RISE).toBe(6)
  })
})
