import { describe, expect, it } from 'vitest'

import { blogPostList } from '@/common/data/blog'
import { pageList, renderPage, shareImageList } from '@/prerender'

const boot = { now: new Date(2026, 10, 26, 12).getTime() }

// The text of a page, without the markers React puts between a text and a
// value
const textOf = (html: string): string => html.replaceAll('<!-- -->', '')

describe('the pages rendered ahead of time', () => {
  it('are every page of the site and every post, once', () => {
    const pathList = pageList.map((page) => page.path)
    expect(new Set(pathList).size).toBe(pathList.length)
    expect(pathList).toEqual(
      expect.arrayContaining([
        '/',
        '/blog/',
        '/about/',
        '/privacy/',
        ...blogPostList.map((post) => `/blog/${post.slug}/`),
      ]),
    )
  })

  it('render each page as itself, never as Not Found', () => {
    pageList.forEach((page) => {
      expect(textOf(renderPage(page.path, boot))).not.toContain(
        'Page not found',
      )
    })
  })

  it('render the body of a post', () => {
    const html = textOf(renderPage('/blog/format-date-with-purescript/', boot))
    expect(html).toContain('Format Date with Purescript')
    expect(html).toContain('purescript-formatters')
  })

  it('mark a post as new from the time they were rendered with', () => {
    const newest = `/blog/${blogPostList[0]?.slug ?? ''}/`
    const at = (date: Date) =>
      textOf(renderPage(newest, { now: date.getTime() }))
    expect(at(new Date(2026, 10, 26, 12))).toContain('>New<')
    expect(at(new Date(2027, 0, 1, 12))).not.toContain('>New<')
  })
})

describe('the share cards', () => {
  it('are one for the image of every page', () => {
    const imagePathList = shareImageList.map((image) => image.path)
    expect(new Set(imagePathList).size).toBe(imagePathList.length)
    pageList.forEach((page) => {
      expect(imagePathList).toContain(page.image.path)
    })
  })

  it('show the title and the tags of a post', () => {
    const post = blogPostList[0]
    const image = shareImageList.find(
      (shown) => shown.path === `/og/blog/${post?.slug ?? ''}.png`,
    )
    expect(image?.card.title).toBe(post?.title)
    expect(image?.card.strip).toEqual({ _tag: 'Tags', tagList: post?.tagList })
  })
})
