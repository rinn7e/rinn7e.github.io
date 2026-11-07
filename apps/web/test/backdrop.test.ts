import { describe, expect, it } from 'vitest'

import { backdropGrid, faceSpans } from '../src/portrait/backdrop'

describe('backdropGrid', () => {
  const grid = backdropGrid(80, 30).split('\n')

  it('fills the asked number of rows and columns', () => {
    expect(grid).toHaveLength(30)
    expect(grid.every((line) => line.length === 80)).toBe(true)
  })

  it('is mirror symmetric around the middle', () => {
    for (const line of backdropGrid(81, 10).split('\n')) {
      expect(line).toBe([...line].reverse().join(''))
    }
  })

  it('uses only light characters', () => {
    expect(grid.join('')).toMatch(/^[ .:+]*$/)
  })

  it('is flat: every part of the screen is about as busy', () => {
    const busy = (lines: string[]) =>
      lines.join('').replace(/ /g, '').length / lines.join('').length
    const top = grid.slice(0, 15).map((l) => l.slice(0, 40))
    const bottom = grid.slice(15).map((l) => l.slice(40))
    expect(Math.abs(busy(top) - busy(bottom))).toBeLessThan(0.05)
  })

  it('is the same on every render', () => {
    expect(backdropGrid(80, 30).split('\n')).toEqual(grid)
  })

  it('leaves the hole blank', () => {
    const holed = backdropGrid(
      80,
      30,
      (x, y) => x >= 30 && x < 50 && y >= 10 && y < 20,
    ).split('\n')
    expect(
      holed.slice(10, 20).every((l) => l.slice(30, 50).trim() === ''),
    ).toBe(true)
    expect(holed[0]).toBe(grid[0])
  })
})

describe('faceSpans', () => {
  it('spans from the first to the last character of each row', () => {
    expect(faceSpans('   ..  @@  ..   \n                \n @')).toEqual([
      [3, 12],
      null,
      [1, 1],
    ])
  })

  it('covers the face in either grid', () => {
    // The right cheek is blank in the light grid and dense in the dark one
    const light = '  @@@@    \n  @@@@    '
    const dark = '  ::::::  \n          '
    expect(faceSpans(light, dark)).toEqual([
      [2, 7],
      [2, 5],
    ])
  })
})
