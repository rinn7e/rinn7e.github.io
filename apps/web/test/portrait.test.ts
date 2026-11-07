import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  EYE_FRAMES,
  EYE_ROWS,
  HAIR_FRAMES,
  HAIR_ROWS,
} from '../src/portrait/animate'
import { PORTRAIT_COLS, PORTRAIT_ROWS } from '../src/portrait/portrait'

const linesOf = (file: string) =>
  readFileSync(join(import.meta.dirname, '../src/portrait', file), 'utf8')
    .replace(/\n$/, '')
    .split('\n')

// A grid must cover its photo exactly, or the colours land on the wrong
// characters: every row full width, blank rows kept
describe.each(['portrait.txt', 'portrait-dark.txt'])('grid %s', (file) => {
  const grid = linesOf(file)

  it('has every row', () => {
    expect(grid).toHaveLength(PORTRAIT_ROWS)
  })

  it('has every column in every row', () => {
    expect(grid.every((line) => line.length === PORTRAIT_COLS)).toBe(true)
  })
})

// Every drawn frame must be as wide and tall as the rows it replaces
describe.each([
  ['hair-frames.txt', HAIR_FRAMES, HAIR_ROWS],
  ['hair-frames-dark.txt', HAIR_FRAMES, HAIR_ROWS],
  ['eye-frames.txt', EYE_FRAMES, EYE_ROWS],
  ['eye-frames-dark.txt', EYE_FRAMES, EYE_ROWS],
  ['eye-frames-style2.txt', EYE_FRAMES, EYE_ROWS],
  ['eye-frames-style2-dark.txt', EYE_FRAMES, EYE_ROWS],
])('frames %s', (file, frames, rows) => {
  const lines = linesOf(file)

  it('has every frame, row and column', () => {
    expect(lines).toHaveLength(frames * rows)
    expect(lines.every((l) => l.length === PORTRAIT_COLS)).toBe(true)
  })
})
