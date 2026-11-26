import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { darkImageOf, readingMinutesOf } from '../../../tool/blog/post-list'

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

describe('the dark version of a picture of a post', () => {
  const darkOf = darkImageOf(process.cwd())

  it('is `<name>.dark.<ext>` next to it in public/, when it is there', () => {
    expect(
      darkOf('/blog/command-sourcing-vs-event-sourcing/two-logs.svg'),
    ).toEqual(
      O.some('/blog/command-sourcing-vs-event-sourcing/two-logs.dark.svg'),
    )
  })

  it('is absent for a picture with none, as on the posts from dev.to', () => {
    expect(
      darkOf('/blog/elm-navigation-with-a-thin-url-wrapper/usual-way.png'),
    ).toEqual(O.none)
  })

  it('is absent for a picture of another site', () => {
    expect(darkOf('https://example.com/a.png')).toEqual(O.none)
  })
})
