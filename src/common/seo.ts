import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'

import { type Product, type ProductLink, productList } from './data/product'

// What search engines and link previews read about the site: the titles and
// the description of each page, and the structured data (schema.org JSON-LD)
// of the person and the products. The build writes them into the HTML of
// each page (`vite.config.ts`); the app sets the same titles as it moves.

export const SITE_URL = 'https://rinn7e.com'
export const PERSON_NAME = 'Moremi Vannak'
export const HANDLE = 'rinn7e'

export const GITHUB_URL = 'https://github.com/rinn7e'
export const LINKEDIN_URL = 'https://www.linkedin.com/in/moremi-vannak/'

export const PRODUCTS_TITLE = `${PERSON_NAME} (${HANDLE}): open-source work`
export const ABOUT_TITLE = `About ${PERSON_NAME} (${HANDLE})`
export const PRIVACY_TITLE = `Privacy - ${HANDLE}`

export const SITE_DESCRIPTION = `${PERSON_NAME} (${HANDLE}), a software engineer and functional programmer (Haskell, TypeScript with fp-ts, PureScript, Elm). Open-source browser extensions, web apps, games and developer tools.`

// The bio of github.com/rinn7e, as written there
export const BIO =
  'Enthusiastic Functional Programmer, specialized in Haskell, Typescript(fp-ts), Purescript, and Elm.'

// The picture of a link preview (1200x630): the top of the products page
export const SOCIAL_IMAGE_URL = `${SITE_URL}/og.png`
export const SOCIAL_IMAGE_ALT = `The profile of ${PERSON_NAME} (${HANDLE}) and the cards of the open-source work`

// A page the build writes, with what a search engine reads of it. `path` is
// where GitHub Pages serves it: each page but the first is a copy of the
// app at `<path>index.html`.
export type SeoPage = {
  readonly path: string
  readonly title: string
  readonly description: string
}

export const seoPageList: readonly SeoPage[] = [
  { path: '/', title: PRODUCTS_TITLE, description: SITE_DESCRIPTION },
  {
    path: '/about/',
    title: ABOUT_TITLE,
    description: `${PERSON_NAME} (${HANDLE}), software engineer. ${BIO} Links to GitHub and LinkedIn.`,
  },
  {
    path: '/privacy/',
    title: PRIVACY_TITLE,
    description: `How ${HANDLE}.com treats your privacy: no analytics, no cookies, and nothing kept about you.`,
  },
]

const personId = `${SITE_URL}/#person`

const sourceUrlOf = (product: Product): O.Option<string> =>
  pipe(
    product.linkList,
    RA.findFirst(
      (link): link is Extract<ProductLink, { _tag: 'SourceLink' }> =>
        link._tag === 'SourceLink',
    ),
    O.map((link) => link.url),
  )

// The page a visitor would use: the live app or game, else the code
const mainUrlOf = (product: Product): O.Option<string> =>
  pipe(
    product.linkList,
    RA.findFirst(
      (link) => link._tag === 'LiveLink' || link._tag === 'PlayLink',
    ),
    O.map((link) => link.url),
    O.alt(() => sourceUrlOf(product)),
  )

const productDataOf = (product: Product) => ({
  '@type': 'SoftwareSourceCode',
  name: product.name,
  description: product.description,
  ...pipe(
    mainUrlOf(product),
    O.fold(
      () => ({}),
      (url) => ({ url }),
    ),
  ),
  ...pipe(
    sourceUrlOf(product),
    O.fold(
      () => ({}),
      (codeRepository) => ({ codeRepository }),
    ),
  ),
  author: { '@id': personId },
})

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': personId,
      name: PERSON_NAME,
      alternateName: HANDLE,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/avatar.webp`,
      jobTitle: 'Software engineer',
      description: BIO,
      knowsAbout: [
        'Functional programming',
        'Haskell',
        'TypeScript',
        'fp-ts',
        'PureScript',
        'Elm',
        'Scala',
      ],
      sameAs: [GITHUB_URL, LINKEDIN_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: HANDLE,
      author: { '@id': personId },
    },
    {
      '@type': 'ItemList',
      name: 'Open-source work',
      itemListElement: pipe(
        productList,
        RA.mapWithIndex((index, product) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: productDataOf(product),
        })),
      ),
    },
  ],
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

// The HTML of `page`: the placeholders of `index.html` filled in, and the
// structured data added to the head (`<` escaped, so no text of it can end
// the script). `isIndexed: false` asks search engines to leave the page out
// (the copy GitHub Pages serves for a path it does not know).
export const htmlOfPage = (
  template: string,
  page: SeoPage,
  isIndexed: boolean = true,
): string => {
  const filled = template
    .replaceAll('%SEO_TITLE%', escapeHtml(page.title))
    .replaceAll('%SEO_DESCRIPTION%', escapeHtml(page.description))
    .replaceAll('%SEO_URL%', `${SITE_URL}${page.path}`)
    .replaceAll('%SEO_PERSON%', escapeHtml(PERSON_NAME))
    .replaceAll('%SEO_HANDLE%', escapeHtml(HANDLE))
    .replaceAll('%SEO_IMAGE%', SOCIAL_IMAGE_URL)
    .replaceAll('%SEO_IMAGE_ALT%', escapeHtml(SOCIAL_IMAGE_ALT))
  const head = [
    `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`,
    ...(isIndexed ? [] : ['<meta name="robots" content="noindex" />']),
  ].join('\n    ')
  return filled.replace('</head>', `    ${head}\n  </head>`)
}

// The sitemap of every page, for search engines (`/sitemap.xml`)
export const sitemapXml = (): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...seoPageList.map(
      (page) => `  <url><loc>${SITE_URL}${page.path}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
