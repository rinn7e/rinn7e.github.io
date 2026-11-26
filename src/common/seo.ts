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
export const BLOG_TITLE = `Blog of ${PERSON_NAME} (${HANDLE})`
export const ABOUT_TITLE = `About ${PERSON_NAME} (${HANDLE})`
export const PRIVACY_TITLE = `Privacy - ${HANDLE}`

export const SITE_DESCRIPTION = `${PERSON_NAME} (${HANDLE}), a software engineer and functional programmer (Haskell, TypeScript with fp-ts, PureScript, Elm). Open-source browser extensions, web apps, games and developer tools.`

// The bio of github.com/rinn7e, as written there
export const BIO =
  'Enthusiastic Functional Programmer, specialized in Haskell, Typescript(fp-ts), Purescript, and Elm.'

// The title of the page of a blog post
export const blogPostTitleOf = (postTitle: string): string =>
  `${postTitle} - ${HANDLE}`

// The picture of the link preview of a page (`og:image`, 1200x630), drawn
// for every page by the build (`src/share-card.tsx`, `scripts/prerender.mjs`)
export const SHARE_IMAGE_WIDTH = 1200
export const SHARE_IMAGE_HEIGHT = 630

export type ShareImage = {
  readonly path: string
  readonly alt: string
}

// The pages that are not a blog post, each with a share card of its own
export type SitePage = 'Home' | 'Blog' | 'About' | 'Privacy'

export const sitePageList: readonly SitePage[] = [
  'Home',
  'Blog',
  'About',
  'Privacy',
]

export const sitePageImagePathOf = (page: SitePage): string =>
  `/og/page/${page.toLowerCase()}.png`

export const blogPostImagePathOf = (slug: string): string =>
  `/og/blog/${slug}.png`

// What a page is to a link preview and to search engines: a blog post is
// an article, with its day and tags; any other page is the profile
export type SeoKind =
  | { readonly _tag: 'Profile' }
  | {
      readonly _tag: 'Article'
      readonly datePublished: string
      readonly tagList: readonly string[]
    }

// A page the build writes, with what a search engine and a link preview
// read of it. `path` is where GitHub Pages serves it: each page but the
// first is a copy of the app at `<path>index.html`, its content rendered
// ahead of time (`scripts/prerender.mjs`). Its canonical address is itself.
export type SeoPage = {
  readonly path: string
  readonly title: string
  readonly description: string
  readonly image: ShareImage
  readonly kind: SeoKind
}

const profile: SeoKind = { _tag: 'Profile' }

export const seoPageList: readonly SeoPage[] = [
  {
    path: '/',
    title: PRODUCTS_TITLE,
    description: SITE_DESCRIPTION,
    image: {
      path: sitePageImagePathOf('Home'),
      alt: `The profile of ${PERSON_NAME} (${HANDLE}) and the open-source work`,
    },
    kind: profile,
  },
  {
    path: '/blog/',
    title: BLOG_TITLE,
    description: `The blog posts of ${PERSON_NAME} (${HANDLE}) on functional programming: Elm, PureScript, Haskell and TypeScript with fp-ts.`,
    image: {
      path: sitePageImagePathOf('Blog'),
      alt: `The blog of ${PERSON_NAME} (${HANDLE})`,
    },
    kind: profile,
  },
  {
    path: '/about/',
    title: ABOUT_TITLE,
    description: `${PERSON_NAME} (${HANDLE}), software engineer. ${BIO} Links to GitHub and LinkedIn.`,
    image: {
      path: sitePageImagePathOf('About'),
      alt: `About ${PERSON_NAME} (${HANDLE})`,
    },
    kind: profile,
  },
  {
    path: '/privacy/',
    title: PRIVACY_TITLE,
    description: `How ${HANDLE}.com treats your privacy: no cookies, nothing kept about you, and visits counted only in total.`,
    image: {
      path: sitePageImagePathOf('Privacy'),
      alt: `The privacy page of ${HANDLE}.com`,
    },
    kind: profile,
  },
]

// The page of a blog post. Its canonical address is the page itself, so
// search engines count the post here (the copy on dev.to points here too
// once its `canonical_url` is set to this address).
export const blogPostSeoPageOf = (post: {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly date: string
  readonly tagList: readonly string[]
}): SeoPage => ({
  path: `/blog/${post.slug}/`,
  title: blogPostTitleOf(post.title),
  description: post.description,
  image: {
    path: blogPostImagePathOf(post.slug),
    alt: `The card of the post ${post.title}`,
  },
  kind: {
    _tag: 'Article',
    datePublished: post.date,
    tagList: post.tagList,
  },
})

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

// The structured data of a page: the person, the site and the products,
// and on the page of a blog post the post itself
const structuredDataOf = (page: SeoPage) => {
  switch (page.kind._tag) {
    case 'Profile':
      return structuredData
    case 'Article':
      return {
        ...structuredData,
        '@graph': [
          ...structuredData['@graph'],
          {
            '@type': 'BlogPosting',
            headline: page.title,
            description: page.description,
            url: `${SITE_URL}${page.path}`,
            mainEntityOfPage: `${SITE_URL}${page.path}`,
            image: `${SITE_URL}${page.image.path}`,
            datePublished: page.kind.datePublished,
            keywords: page.kind.tagList.join(', '),
            author: { '@id': personId },
          },
        ],
      }
  }
}

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
    .replaceAll(
      '%SEO_TYPE%',
      page.kind._tag === 'Article' ? 'article' : 'profile',
    )
    .replaceAll('%SEO_PERSON%', escapeHtml(PERSON_NAME))
    .replaceAll('%SEO_HANDLE%', escapeHtml(HANDLE))
    .replaceAll('%SEO_IMAGE%', `${SITE_URL}${page.image.path}`)
    .replaceAll('%SEO_IMAGE_ALT%', escapeHtml(page.image.alt))
  const head = [
    `<script type="application/ld+json">${JSON.stringify(structuredDataOf(page)).replaceAll('<', '\\u003c')}</script>`,
    ...(isIndexed ? [] : ['<meta name="robots" content="noindex" />']),
  ].join('\n    ')
  return filled.replace('</head>', `    ${head}\n  </head>`)
}

// The sitemap of `pageList` (every page of the build), for search engines
// (`/sitemap.xml`)
export const sitemapXml = (pageList: readonly SeoPage[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pageList.map(
      (page) => `  <url><loc>${SITE_URL}${page.path}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
