import * as E from 'fp-ts/Either'
import { describe, expect, it } from 'vitest'

import { decodePostFile, postFileText } from '../../../tool/blog/front-matter'

const postFile = [
  '---',
  'title: A post',
  'description: About a post',
  'date: 2026-10-27',
  'tags:',
  '  - elm',
  'devToUrl: https://dev.to/rinn7e/a-post-x1y',
  'devToId: 42',
  '---',
  '',
  'The body.',
  '',
].join('\n')

describe('a post file', () => {
  it('reads the front matter and the body', () => {
    expect(decodePostFile(postFile)).toEqual(
      E.right({
        frontMatter: {
          title: 'A post',
          description: 'About a post',
          date: '2026-10-27',
          tags: ['elm'],
          devToUrl: 'https://dev.to/rinn7e/a-post-x1y',
          devToId: 42,
        },
        body: 'The body.\n',
      }),
    )
  })

  it('reads a file with Windows line ends the same', () => {
    expect(decodePostFile(postFile.replaceAll('\n', '\r\n'))).toEqual(
      decodePostFile(postFile),
    )
  })

  it('is written back as it is read', () => {
    const decoded = decodePostFile(postFile)
    expect(E.map(postFileText)(decoded)).toEqual(E.right(postFile))
  })

  it('names the field that does not fit', () => {
    const result = decodePostFile(
      postFile.replace('date: 2026-10-27', 'date: last week'),
    )
    expect(E.isLeft(result) && result.left).toContain('date')
  })

  it('is refused with no front matter', () => {
    expect(E.isLeft(decodePostFile('Just a body.'))).toBe(true)
  })
})
