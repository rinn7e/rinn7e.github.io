import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'
import {
  htmlOfPage,
  seoPageList,
  sitemapXml,
  structuredData,
} from '@/common/seo'

const template =
  '<html><head><title>%SEO_TITLE%</title><link rel="canonical" href="%SEO_URL%" /></head><body></body></html>'

describe('search data', () => {
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

  it('lists every page in the sitemap', () => {
    seoPageList.forEach((page) => {
      expect(sitemapXml()).toContain(
        `<loc>https://rinn7e.com${page.path}</loc>`,
      )
    })
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
