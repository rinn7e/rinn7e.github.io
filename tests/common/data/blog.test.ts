import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import {
  blogPostList,
  isNewPost,
  neighbourPostsOf,
  newSinceOf,
  readableDateOf,
} from '@/common/data/blog'
import { blogPostDestination, toUrlString } from '@/common/type/destination'

import { blogPostPathOf } from '../../../tool/blog/post-list'

describe('the posts of the blog', () => {
  it('come newest first', () => {
    const dateList = blogPostList.map((post) => post.date)
    expect(dateList).toEqual([...dateList].sort().reverse())
  })

  it('each have a title, a description and their original on dev.to', () => {
    blogPostList.forEach((post) => {
      expect(post.title).not.toBe('')
      expect(post.description).not.toBe('')
      expect(post.canonicalUrl).toMatch(/^https:\/\/dev\.to\/rinn7e\//)
    })
  })

  it('are written by the build at the address the app spells', () => {
    blogPostList.forEach((post) => {
      expect(blogPostPathOf(post.slug)).toBe(
        toUrlString(blogPostDestination(post.slug)),
      )
    })
  })

  it('show the day they were published as a reader reads it', () => {
    expect(readableDateOf('2026-10-27')).toBe('27 Oct 2026')
    expect(readableDateOf('2025-09-06')).toBe('6 Sep 2025')
  })
})

describe('the posts on either side of a post', () => {
  it('are the newer one before it and the older one after it', () => {
    const [newest, second, third] = blogPostList
    if (newest !== undefined && second !== undefined && third !== undefined) {
      expect(neighbourPostsOf(second.slug)).toEqual({
        newer: O.some(newest),
        older: O.some(third),
      })
    }
  })

  it('are only one at either end of the list', () => {
    const newest = blogPostList[0]
    const oldest = blogPostList[blogPostList.length - 1]
    expect(neighbourPostsOf(newest?.slug ?? '').newer).toEqual(O.none)
    expect(neighbourPostsOf(oldest?.slug ?? '').older).toEqual(O.none)
  })

  it('are none for a slug with no post', () => {
    expect(neighbourPostsOf('nonsense')).toEqual({
      newer: O.none,
      older: O.none,
    })
  })
})

describe('a new post', () => {
  const postOn = (date: string) => ({ ...blogPostList[0]!, date })

  it('counts from the local day 30 days before now', () => {
    expect(newSinceOf(new Date(2026, 10, 26, 12).getTime())).toBe('2026-10-27')
    expect(newSinceOf(new Date(2026, 2, 5, 23, 59).getTime())).toBe(
      '2026-02-03',
    )
  })

  it('is one published on or after that day', () => {
    expect(isNewPost(postOn('2026-10-27'), '2026-10-27')).toBe(true)
    expect(isNewPost(postOn('2026-11-20'), '2026-10-27')).toBe(true)
    expect(isNewPost(postOn('2026-10-26'), '2026-10-27')).toBe(false)
  })
})
