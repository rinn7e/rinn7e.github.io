import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '../../../tool/blog/render'

const localLinkMap = new Map([
  ['https://dev.to/rinn7e/a-post-x1y', '/blog/a-post'],
])

// A post with a dark version of one picture only
const darkImageOf = (src: string) =>
  src === '/blog/a-post/flow.svg'
    ? O.some('/blog/a-post/flow.dark.svg')
    : O.none

const render = (markdown: string) =>
  renderMarkdown(markdown, localLinkMap, darkImageOf)

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

  it('puts code in the code block of the site', () => {
    expect(render('```elm\nmain = 1\n```')).toMatch(
      /^<pre><code class="hljs">.*<\/code><\/pre>/,
    )
  })

  it('guesses the language of code with an unknown or no language, escaped', () => {
    const html = render('```nonsense\n<b>x</b>\n```')
    expect(html).toContain('hljs-')
    expect(html).not.toContain('<b>')
    expect(render('```\n<b>x</b>\n```')).toBe(html)
  })

  it('shows raw HTML of the Markdown as text', () => {
    expect(render('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('loads a picture lazily', () => {
    expect(render('![a map](/blog/a-post/map.png)')).toContain('loading="lazy"')
  })

  it('shows the dark version of a picture when the system theme is dark', () => {
    expect(render('![a flow](/blog/a-post/flow.svg)')).toContain(
      '<picture><source srcset="/blog/a-post/flow.dark.svg" media="(prefers-color-scheme: dark)"><img src="/blog/a-post/flow.svg" alt="a flow" loading="lazy" decoding="async"></picture>',
    )
  })

  it('keeps a picture with no dark version a plain image', () => {
    const html = render('![a map](/blog/a-post/map.png)')
    expect(html).not.toContain('<picture>')
    expect(html).toContain('<img src="/blog/a-post/map.png"')
  })
})
