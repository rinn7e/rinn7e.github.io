import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'
import {
  blogPostSeoPageOf,
  htmlOfPage,
  seoPageList,
  sitemapXml,
  structuredData,
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
