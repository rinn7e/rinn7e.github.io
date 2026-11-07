import { describe, expect, it } from 'vitest'

import {
  TRANSITION_MS,
  fadeLayerStyle,
  linearEasing,
  partWindow,
  spring,
} from '../src/portrait/screen-fade'

const end = (w: { delay: number; duration: number }) => w.delay + w.duration

describe('the switch to screen 2', () => {
  it('fades the face out first, and screen 2 in before the face has gone', () => {
    const face = partWindow('face', 'opening')
    const screen = partWindow('screen', 'opening')
    expect(face.delay).toBe(0)
    expect(screen.delay).toBeGreaterThan(0)
    expect(screen.delay).toBeLessThan(end(face))
    expect(end(screen)).toBe(TRANSITION_MS)
  })

  it('closes as the mirror image of opening, the face back last', () => {
    for (const part of ['face', 'screen', 'lines'] as const) {
      const open = partWindow(part, 'opening')
      const close = partWindow(part, 'closing')
      expect(close.duration).toBe(open.duration)
      expect(close.delay).toBe(TRANSITION_MS - end(open))
    }
    expect(end(partWindow('face', 'closing'))).toBe(TRANSITION_MS)
  })

  it('springs in without overshooting', () => {
    const steps = Array.from({ length: 21 }, (_, i) => spring(i / 20))
    expect(steps[0]).toBe(0)
    expect(steps[20]).toBeCloseTo(1)
    expect(steps.every((v, i) => i === 0 || v >= (steps[i - 1] ?? 0))).toBe(
      true,
    )
    expect(linearEasing(spring, 4)).toMatch(/^linear\(0\.0000, .*1\.0000\)$/)
  })

  it('hides a faded layer only once its fade is over', () => {
    const out = fadeLayerStyle(false, 'face', 'closing', false)
    const w = partWindow('face', 'closing')
    expect(out.visibility).toBe('hidden')
    expect(out.transitionDelay).toBe(`${w.delay}ms, ${end(w)}ms`)
    expect(fadeLayerStyle(true, 'face', 'opening', false).transitionDelay).toBe(
      '0ms, 0ms',
    )
  })
})
