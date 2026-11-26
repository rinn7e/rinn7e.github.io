import { describe, expect, it } from 'vitest'

import { blogPostList, readableDateOf } from '@/common/data/blog'
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
