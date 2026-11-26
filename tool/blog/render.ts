import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'

// The Markdown of a post to HTML, at build time, so the browser gets the
// HTML and no Markdown or highlighting code. Raw HTML in the Markdown is
// shown as text (`html: false`), as the posts only hold HTML inside code.

// The address on this site of each post, by its dev.to address (its
// canonical URL, with no trailing slash): a link from one post to another
// stays on this site
export type LocalLinkMap = ReadonlyMap<string, string>

// The version for the dark theme of a picture of a post, by the address of
// its light version, when the post has one
export type DarkImageOf = (src: string) => O.Option<string>

// A block of code, as TEA Ecosystem shows code (its `codeBlockView`): the
// colors are classes of highlight.js (`hljs-keyword`), styled in
// `src/asset/index.css` for light and dark. A block with no language, or
// one highlight.js does not know, gets the language highlight.js guesses.
// markdown-it takes a result that starts with `<pre` as the whole block.
const highlightCode = (code: string, language: string): string => {
  const trimmed = code.trimEnd()
  const html =
    language !== '' && hljs.getLanguage(language) !== undefined
      ? hljs.highlight(trimmed, { language, ignoreIllegals: true }).value
      : hljs.highlightAuto(trimmed).value
  return `<pre><code class="hljs">${html}</code></pre>`
}

const withoutTrailingSlash = (url: string): string => url.replace(/\/$/, '')

// The attributes a link of a post gets: a link to another post goes to its
// page here; any other link to another site opens in a new tab, as every
// outside link of the site does; a link within the site, or to an anchor,
// stays as written
const linkAttrListOf = (
  href: string,
  localLinkMap: LocalLinkMap,
): readonly (readonly [string, string])[] => {
  const local = localLinkMap.get(withoutTrailingSlash(href))
  if (local !== undefined) {
    return [['href', local]]
  } else if (/^https?:\/\//.test(href)) {
    return [
      ['target', '_blank'],
      ['rel', 'noopener noreferrer'],
    ]
  } else {
    return []
  }
}

export const renderMarkdown = (
  markdown: string,
  localLinkMap: LocalLinkMap,
  darkImageOf: DarkImageOf,
): string => {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    highlight: highlightCode,
  })
  const renderImage = md.renderer.rules.image

  md.renderer.rules.link_open = (tokens, index, options, _env, self) => {
    const token = tokens[index]
    linkAttrListOf(String(token?.attrGet('href') ?? ''), localLinkMap).forEach(
      ([name, value]) => token?.attrSet(name, value),
    )
    return self.renderToken(tokens, index, options)
  }

  // Pictures load as they come near, under the text above them. A picture
  // with a version for the dark theme becomes a `<picture>` that shows it
  // when the system is dark, as the site follows the system theme (the
  // `dark:` of Tailwind); the browser loads only the one it shows.
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index]
    token?.attrSet('loading', 'lazy')
    token?.attrSet('decoding', 'async')
    const img =
      renderImage === undefined
        ? self.renderToken(tokens, index, options)
        : renderImage(tokens, index, options, env, self)
    return pipe(
      O.fromNullable(token?.attrGet('src')),
      O.chain((src) => darkImageOf(String(src))),
      O.fold(
        () => img,
        (dark) =>
          `<picture><source srcset="${md.utils.escapeHtml(dark)}" media="(prefers-color-scheme: dark)">${img}</picture>`,
      ),
    )
  }

  // A wide table scrolls on its own, never the page
  md.renderer.rules.table_open = () => '<div class="blog-table"><table>\n'
  md.renderer.rules.table_close = () => '</table></div>\n'

  return md.render(markdown)
}
