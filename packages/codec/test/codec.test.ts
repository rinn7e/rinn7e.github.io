import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { describe, expect, it } from 'vitest'

import { decodeWith, refinedString } from '../src/index.ts'

const Upper = refinedString(
  'Upper',
  (s) => s === s.toUpperCase(),
  'expected upper case',
)

const Thing = t.intersection([
  t.type({ name: Upper, tags: t.array(t.string) }),
  t.partial({ note: t.string }),
])

describe('decodeWith', () => {
  it('decodes a valid value', () => {
    expect(decodeWith(Thing)({ name: 'A', tags: [] })).toEqual(
      E.right({ name: 'A', tags: [] }),
    )
  })

  it('uses the hint of a refined string', () => {
    expect(decodeWith(Thing)({ name: 'a', tags: [] })).toEqual(
      E.left(['name: expected upper case, got "a"']),
    )
  })

  it('keeps array indexes but drops intersection keys from the path', () => {
    expect(decodeWith(Thing)({ name: 'A', tags: ['x', 3] })).toEqual(
      E.left(['tags.1: expected string, got 3']),
    )
  })
})
