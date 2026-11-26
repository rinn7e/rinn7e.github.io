import { describe, expect, it } from 'vitest'

import { readingMinutesOf } from '../../../tool/blog/post-list'

const wordsOf = (count: number): string => 'word '.repeat(count)

describe('the minutes to read a post', () => {
  it('counts 275 words a minute, rounded up, as dev.to does', () => {
    expect(readingMinutesOf(wordsOf(275))).toBe(1)
    expect(readingMinutesOf(wordsOf(276))).toBe(2)
    expect(readingMinutesOf(wordsOf(2460))).toBe(9)
  })

  it('is at least one minute', () => {
    expect(readingMinutesOf('')).toBe(1)
  })
})
