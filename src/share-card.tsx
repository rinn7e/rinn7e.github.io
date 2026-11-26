import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { type ReactElement } from 'react'

import { readableDateOf } from '@/common/data/blog'
import { type Product, productList } from '@/common/data/product'
import {
  BIO,
  HANDLE,
  PERSON_NAME,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type SitePage,
} from '@/common/seo'
import { type BlogPost } from '@/common/type/blog-post'

// The link preview of every page (`og:image`): a card of 1200x630 in the
// look of the site, drawn at build time with satori and resvg
// (`scripts/prerender.mjs`), as TEA Ecosystem draws its own, so a link
// shared on a chat or a social site shows what it leads to. On the axis:
// the photo and the name, a quiet label, a large title, then the tags of a
// post, a lead, or the logos of the work, and the address at the bottom.
// Satori lays out a subset of CSS with flexbox only and reads inline
// styles, so this one file styles with `style` instead of Tailwind, and
// every box with more than one child says `display: flex`.

// The colors of the site in light mode
const color = {
  page: '#f4f5f7',
  card: '#ffffff',
  line: '#e4e4e7',
  ink: '#0c1014',
  muted: '#6a717a',
  body: '#52525b',
}

// The colors of the `#` of a tag, as `src/component/blog/tag-list.tsx`
const hashColorList = [
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#e11d48',
  '#0891b2',
]

const hashColorOf = (tag: string): string =>
  hashColorList[
    pipe(
      [...tag],
      RA.reduce(0, (sum, char) => sum + (char.codePointAt(0) ?? 0)),
    ) % hashColorList.length
  ] ?? color.muted

// What a card shows under its title
export type ShareStrip =
  | { readonly _tag: 'Tags'; readonly tagList: readonly string[] }
  | { readonly _tag: 'Lead'; readonly text: string }
  | { readonly _tag: 'Products'; readonly productList: readonly Product[] }

export type ShareCard = {
  // The quiet uppercase label over the title
  readonly label: string
  readonly title: string
  readonly strip: ShareStrip
  // The address, without `https://`
  readonly address: string
}

export const postShareCardOf = (post: BlogPost): ShareCard => ({
  label: `${readableDateOf(post.date)} · ${post.readingMinutes} min read`,
  title: post.title,
  strip: { _tag: 'Tags', tagList: post.tagList },
  address: `${HANDLE}.com/blog`,
})

export const pageShareCardOf =
  (postCount: number) =>
  (page: SitePage): ShareCard => {
    switch (page) {
      case 'Home':
        return {
          label: 'Software engineer · open-source work',
          title: PERSON_NAME,
          strip: { _tag: 'Products', productList },
          address: `${HANDLE}.com`,
        }
      case 'Blog':
        return {
          label: 'Blog',
          title: `Blog of ${PERSON_NAME}`,
          strip: {
            _tag: 'Lead',
            text: `${postCount} posts on functional programming: Elm, PureScript, Haskell and TypeScript with fp-ts`,
          },
          address: `${HANDLE}.com/blog`,
        }
      case 'About':
        return {
          label: 'About',
          title: PERSON_NAME,
          strip: { _tag: 'Lead', text: BIO },
          address: `${HANDLE}.com/about`,
        }
      case 'Privacy':
        return {
          label: 'Privacy',
          title: 'No cookies, nothing kept about you',
          strip: { _tag: 'Lead', text: 'Visits are only counted in total.' },
          address: `${HANDLE}.com/privacy`,
        }
    }
  }

// A long title takes a smaller size, so it stays within three lines
const titleSizeOf = (title: string): number =>
  title.length > 60 ? 54 : title.length > 36 ? 62 : 72

const tagStripView = (tagList: readonly string[]) => (
  <div style={{ display: 'flex', gap: 28, fontSize: 30, color: color.body }}>
    {pipe(
      tagList,
      RA.map((tag) => (
        <div key={tag} style={{ display: 'flex' }}>
          <span style={{ color: hashColorOf(tag) }}>#</span>
          <span>{tag}</span>
        </div>
      )),
    )}
  </div>
)

const productStripView = (
  shownList: readonly Product[],
  logoSrcOf: (product: Product) => string | undefined,
) => (
  <div style={{ display: 'flex', gap: 36 }}>
    {pipe(
      shownList,
      RA.map((product) => {
        const src = logoSrcOf(product)
        return (
          <div
            key={product.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 88,
                height: 88,
                borderRadius: 20,
                border: `2px solid ${color.line}`,
                background: color.card,
              }}
            >
              {src === undefined ? (
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: product.color,
                  }}
                >
                  {product.logo._tag === 'MonogramLogo'
                    ? product.logo.letters
                    : product.cardName.slice(0, 2)}
                </span>
              ) : (
                <img src={src} width={60} height={60} />
              )}
            </div>
            <span style={{ fontSize: 20, color: color.muted }}>
              {product.cardName}
            </span>
          </div>
        )
      }),
    )}
  </div>
)

const stripView = (
  strip: ShareStrip,
  logoSrcOf: (product: Product) => string | undefined,
) => {
  switch (strip._tag) {
    case 'Tags':
      return tagStripView(strip.tagList)
    case 'Lead':
      return (
        <div
          style={{
            display: 'flex',
            maxWidth: 860,
            fontSize: 30,
            lineHeight: 1.45,
            color: color.body,
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          {strip.text}
        </div>
      )
    case 'Products':
      return productStripView(strip.productList.slice(0, 4), logoSrcOf)
  }
}

// The card of a page, for satori. `avatarSrc` and `logoSrcOf` are data URLs
// the build reads from `public/` (satori loads no file of its own).
export const shareCardView = ({
  card,
  avatarSrc,
  logoSrcOf,
}: {
  readonly card: ShareCard
  readonly avatarSrc: string
  readonly logoSrcOf: (product: Product) => string | undefined
}): ReactElement => (
  <div
    style={{
      display: 'flex',
      // The padding inside the size of the image (satori adds it on top
      // otherwise, and the card runs past the edge)
      boxSizing: 'border-box',
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      padding: 40,
      background: color.page,
      fontFamily: 'Inter',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Fills the frame inside its padding (a size of 100% would add the
        // padding of the card on top, past the edge of the image)
        flexGrow: 1,
        padding: '44px 72px 40px',
        borderRadius: 28,
        border: `2px solid ${color.line}`,
        background: color.card,
        color: color.ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img
          src={avatarSrc}
          width={64}
          height={64}
          style={{ borderRadius: 32 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 28, fontWeight: 800 }}>{HANDLE}</span>
          <span style={{ fontSize: 20, color: color.muted }}>
            {PERSON_NAME}
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: color.muted,
          }}
        >
          {card.label}
        </span>
        <div
          style={{
            display: 'flex',
            maxWidth: 960,
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: titleSizeOf(card.title),
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {card.title}
        </div>
        {stripView(card.strip, logoSrcOf)}
      </div>
      <span style={{ fontSize: 22, color: color.muted }}>{card.address}</span>
    </div>
  </div>
)
