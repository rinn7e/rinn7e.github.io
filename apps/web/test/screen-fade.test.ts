import { describe, expect, it } from 'vitest'

import {
  IN_FROM,
  LINE_FROM,
  OUT_UNTIL,
  coverAt,
  lineAt,
  textAt,
} from '../src/portrait/screen-fade'

describe('the fade to screen 2', () => {
  it('fades the face out and screen 2 in, overlapping', () => {
    expect(coverAt(0)).toBe(0)
    expect(coverAt(OUT_UNTIL)).toBe(1)
    expect(textAt(IN_FROM)).toBe(0)
    expect(textAt(1)).toBeCloseTo(1)
    // Screen 2 starts before the face has gone
    expect(IN_FROM).toBeLessThan(OUT_UNTIL)
  })

  it('moves fast at first and settles without overshooting', () => {
    expect(coverAt(OUT_UNTIL / 4)).toBeGreaterThan(0.5)
    const steps = Array.from({ length: 21 }, (_, i) => textAt(i / 20))
    expect(steps.every((v, i) => i === 0 || v >= (steps[i - 1] ?? 0))).toBe(
      true,
    )
    expect(Math.max(...steps)).toBeLessThanOrEqual(1)
  })
})

describe('the lines of screen 2', () => {
  it('grow from nothing to their full length, after the screen starts', () => {
    expect(lineAt(LINE_FROM)).toBe(0)
    expect(lineAt(1)).toBe(1)
    expect(lineAt((LINE_FROM + 1) / 2)).toBeGreaterThan(0.5)
  })
})
