import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'
import {
  FEED_PATH,
  blogPostSeoPageOf,
  htmlOfPage,
  rssXml,
  seoPageList,
  sitemapXml,
  structuredData,
  withAbsoluteUrls,
} from '@/common/seo'
import {
  type Destination,
  type Screen,
  aboutDestination,
  blogDestination,
  defaultDestination,
  privacyDestination,
  toUrlString,
} from '@/common/type/destination'

const template =
  '<html><head><title>%SEO_TITLE%</title><link rel="canonical" href="%SEO_URL%" /><meta property="og:type" content="%SEO_TYPE%" /><meta property="og:image" content="%SEO_IMAGE%" /></head><body></body></html>'

const aPost = blogPostSeoPageOf({
  slug: 'a-post',
  title: 'A post',
  description: 'About a post',
  date: '2026-10-27',
  tagList: ['elm'],
})

// Every screen of the app that is a page of its own, at its address. A new
// screen fails the type check here until it is added, and then the test
// below until it has its entry in `seoPageList`, which puts it in the
// prerendered build and in the sitemap. A blog post gets its entry from the
// build, and the page not found is left out of search.
const pageOfScreen: Record<
  Exclude<Screen['_tag'], 'BlogPostScreen' | 'NotFoundScreen'>,
  Destination
> = {
  ProductsScreen: defaultDestination(),
  BlogScreen: blogDestination(),
  AboutScreen: aboutDestination(),
  PrivacyScreen: privacyDestination(),
}

const withTrailingSlash = (path: string): string =>
  path.endsWith('/') ? path : `${path}/`

describe('search data', () => {
  it('has an entry for every page of the app, for search engines and the sitemap', () => {
    const seoPathList = seoPageList.map((page) => withTrailingSlash(page.path))
    Object.values(pageOfScreen).forEach((destination) => {
      expect(seoPathList).toContain(withTrailingSlash(toUrlString(destination)))
    })
  })

  it('fills in the head of each page with its own title and address', () => {
    seoPageList.forEach((page) => {
      const html = htmlOfPage(template, page)
      expect(html).toContain(`<title>${page.title}</title>`)
      expect(html).toContain(`href="https://rinn7e.com${page.path}"`)
      expect(html).toContain('application/ld+json')
      expect(html).not.toContain('noindex')
    })
  })

  it('leaves the not found copy out of search', () => {
    const [firstPage] = seoPageList
    expect(firstPage).toBeDefined()
    if (firstPage !== undefined) {
      expect(htmlOfPage(template, firstPage, false)).toContain(
        '<meta name="robots" content="noindex" />',
      )
    }
  })

  it('lists every page it is given in the sitemap', () => {
    const pageList = [...seoPageList, aPost]
    pageList.forEach((page) => {
      expect(sitemapXml(pageList)).toContain(
        `<loc>https://rinn7e.com${page.path}</loc>`,
      )
    })
  })

  it('gives each page its own share image', () => {
    const pathList = [...seoPageList, aPost].map((page) => page.image.path)
    expect(new Set(pathList).size).toBe(pathList.length)
    seoPageList.forEach((page) => {
      expect(htmlOfPage(template, page)).toContain(
        `content="https://rinn7e.com${page.image.path}"`,
      )
    })
  })

  it('counts the page of a post as an article at its own address', () => {
    const html = htmlOfPage(template, aPost)
    expect(aPost.path).toBe('/blog/a-post/')
    expect(html).toContain('<title>A post - rinn7e</title>')
    expect(html).toContain('href="https://rinn7e.com/blog/a-post/"')
    expect(html).toContain('<meta property="og:type" content="article" />')
    expect(html).toContain('"@type":"BlogPosting"')
    expect(html).toContain('"datePublished":"2026-10-27"')
    expect(html).toContain('content="https://rinn7e.com/og/blog/a-post.png"')
  })

  it('describes every product in the structured data', () => {
    const list = structuredData['@graph'][2]
    expect(list).toMatchObject({ '@type': 'ItemList' })
    const names = JSON.stringify(list)
    productList.forEach((product) => {
      expect(names).toContain(product.name)
    })
  })
})

describe('the feed of the blog', () => {
  const post = {
    slug: 'a-post',
    title: 'Tom & Jerry <3',
    description: 'About a post',
    date: '2026-11-26',
    tagList: ['elm', 'haskell'],
    html: '<p><img src="/blog/a-post/flow.svg" alt=""> <a href="/blog/other">x</a> <a href="https://elm-lang.org">y</a> ]]> end</p>',
  }
  const feed = rssXml([post])

  it('lists each post whole, at its address on the site', () => {
    expect(feed).toContain('<link>https://rinn7e.com/blog/a-post/</link>')
    expect(feed).toContain(
      '<guid isPermaLink="true">https://rinn7e.com/blog/a-post/</guid>',
    )
    expect(feed).toContain('<pubDate>Thu, 26 Nov 2026 00:00:00 GMT</pubDate>')
    expect(feed).toContain('<title>Tom &amp; Jerry &lt;3</title>')
    expect(feed).toContain('<category>haskell</category>')
    expect(feed).toContain('<content:encoded><![CDATA[<p>')
  })

  it('makes the addresses of the site absolute, and keeps the others', () => {
    expect(withAbsoluteUrls(post.html)).toContain(
      'src="https://rinn7e.com/blog/a-post/flow.svg"',
    )
    expect(withAbsoluteUrls(post.html)).toContain(
      'href="https://rinn7e.com/blog/other"',
    )
    expect(withAbsoluteUrls(post.html)).toContain('href="https://elm-lang.org"')
  })

  it('keeps a ]]> in a post from ending its CDATA', () => {
    expect(feed).toContain(']]]]><![CDATA[> end')
  })

  it('is linked from the head of every page', () => {
    const [home] = seoPageList
    const head =
      '<html><head><link rel="alternate" type="application/rss+xml" title="%SEO_FEED_TITLE%" href="%SEO_FEED_URL%" /></head></html>'
    expect(home).toBeDefined()
    if (home !== undefined) {
      expect(htmlOfPage(head, home)).toContain(
        `href="https://rinn7e.com${FEED_PATH}"`,
      )
    }
  })
})
