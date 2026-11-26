import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '../../../tool/blog/render'

const localLinkMap = new Map([
  ['https://dev.to/rinn7e/a-post-x1y', '/blog/a-post'],
])

const render = (markdown: string) => renderMarkdown(markdown, localLinkMap)

describe('the HTML of a post', () => {
  it('keeps a link to another post on this site', () => {
    expect(render('[the post](https://dev.to/rinn7e/a-post-x1y)')).toContain(
      '<a href="/blog/a-post">the post</a>',
    )
  })

  it('opens a link to another site in a new tab', () => {
    expect(render('[elm](https://elm-lang.org)')).toContain(
      '<a href="https://elm-lang.org" target="_blank" rel="noopener noreferrer">',
    )
  })

  it('colors the code of a language highlight.js knows', () => {
    expect(render('```elm\nmain = text "hi"\n```')).toContain(
      '<span class="hljs-string">&quot;hi&quot;</span>',
    )
  })

  it('shows the code of an unknown language as plain, escaped text', () => {
    const html = render('```nonsense\n<b>x</b>\n```')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('hljs-')
  })

  it('shows raw HTML of the Markdown as text', () => {
    expect(render('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('loads a picture lazily', () => {
    expect(render('![a map](/blog/a-post/map.png)')).toContain('loading="lazy"')
  })
})
