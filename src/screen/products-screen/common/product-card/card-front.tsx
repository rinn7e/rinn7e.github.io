import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { ArrowUpRight } from 'lucide-react'
import React from 'react'

import { type Product, quickLinkOf } from '@/common/data/product'
import { categoryIconView } from '@/component/category'

// The front of a card: the logo of the product on white paper, framed like
// a playing card, its name and suit at the top and a tagline at the bottom,
// under the sunlight that follows the pointer

// The card is drawn on a 100 x 140 grid (5:7), so its SVG parts share one
// scale with the `cqw` sizes (1 unit = 1cqw)
const CARD_W = 100
const CARD_H = 140

// The frame: a thin line inset from the edge, with a concave notch at two
// corners. Its top and bottom edges sit lower and higher than its sides, to
// leave a band for the title, as the index of a playing card
const FRAME_INSET_X = 7
const FRAME_INSET_Y = 17
const FRAME_NOTCH = 6

const framePath = (): string => {
  const x = FRAME_INSET_X
  const y = FRAME_INSET_Y
  const r = FRAME_NOTCH
  const right = CARD_W - x
  const bottom = CARD_H - y
  // Notched at the top left and bottom right, square at the other two
  // corners, where the suits sit
  return [
    `M ${x + r} ${y}`,
    `H ${right}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 0 ${right - r} ${bottom}`,
    `H ${x}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 0 ${x + r} ${y}`,
    'Z',
  ].join(' ')
}

const cardFrameView = () => (
  <svg
    viewBox={`0 0 ${CARD_W} ${CARD_H}`}
    aria-hidden='true'
    className='pointer-events-none absolute inset-0 size-full'
    fill='none'
  >
    <path
      d={framePath()}
      stroke='var(--card-ink)'
      strokeOpacity='0.55'
      strokeWidth='0.6'
    />
  </svg>
)

// The suit of a card: the icon of its first category
const suitView = ({ product }: { readonly product: Product }) =>
  pipe(
    RA.head(product.categoryList),
    O.fold(
      () => null,
      (category) =>
        categoryIconView({ category, className: 'size-[8cqw] shrink-0' }),
    ),
  )

// The bands above and below the frame, each as tall as the space the frame
// leaves there, their ends on the side lines of the frame, in the color of
// the product: the title at the top left with the suit across from it, and a
// short tagline at the bottom right with the suit across from it
const cardTitleView = ({ product }: { readonly product: Product }) => (
  <div className='absolute inset-x-[0] top-[0] flex h-[17cqw] items-center justify-between gap-[3cqw] px-[7cqw] text-[var(--card-ink)]'>
    <p className='min-w-0 truncate text-left text-[7cqw] leading-[1.2] font-semibold'>
      {product.cardName}
    </p>
    {suitView({ product })}
  </div>
)

// On a card of the grid (`quickLabel`), the tagline gives way to where the
// footer links (a layer over it, see the grid) while the card is under the
// pointer or the link has the focus; with no hover (a phone), a small arrow
// beside the tagline says the footer is a link
const cardTaglineView = ({
  product,
  quickLabel,
}: {
  readonly product: Product
  readonly quickLabel: Option<string>
}) => (
  <div className='absolute inset-x-[0] bottom-[0] flex h-[17cqw] items-center justify-between gap-[3cqw] px-[7cqw] text-[var(--card-ink)]'>
    {suitView({ product })}
    <p className='relative flex min-w-0 items-center justify-end text-right text-[5.4cqw] leading-[1.2]'>
      <span
        className={[
          'flex min-w-0 items-center gap-[1cqw] font-normal opacity-85 transition-opacity',
          O.isSome(quickLabel)
            ? 'group-hover/card:opacity-0 group-has-[a:focus-visible]/card:opacity-0'
            : '',
        ].join(' ')}
      >
        <span className='truncate'>{product.cardTagline}</span>
        {O.isSome(quickLabel) ? (
          <ArrowUpRight
            aria-hidden='true'
            className='hidden size-[5.4cqw] shrink-0 [@media(hover:none)]:block'
          />
        ) : null}
      </span>
      {pipe(
        quickLabel,
        O.fold(
          () => null,
          (label) => (
            <span
              aria-hidden='true'
              className='absolute inset-y-[0] right-[0] flex max-w-full items-center gap-[1cqw] font-semibold whitespace-nowrap opacity-0 transition-opacity group-hover/card:opacity-100 group-has-[a:focus-visible]/card:opacity-100 group-has-[a:hover]/card:underline'
            >
              <span className='truncate'>{label}</span>
              <ArrowUpRight
                aria-hidden='true'
                className='size-[5.4cqw] shrink-0'
              />
            </span>
          ),
        ),
      )}
    </p>
  </div>
)

// The logo fills the card, or the monogram of a product that has none of its
// own, in the color of the product
const logoView = ({ product }: { readonly product: Product }) => {
  const { logo } = product
  switch (logo._tag) {
    case 'ImageLogo':
      return (
        <img
          src={`/${logo.src}`}
          alt=''
          draggable={false}
          className='size-full object-contain'
        />
      )
    case 'MonogramLogo':
      return (
        <span
          aria-hidden='true'
          style={{ '--card-color': product.color }}
          className='text-[19cqw] leading-none font-bold text-[var(--card-ink)]'
        >
          {logo.letters}
        </span>
      )
  }
}

export const cardFrontView = ({
  product,
  hasQuickLink,
}: {
  readonly product: Product
  readonly hasQuickLink: boolean
}) => (
  <div
    style={{ '--card-color': product.color }}
    className='card-edge card-paper absolute inset-0 overflow-hidden rounded-[4.5cqw] [backface-visibility:hidden]'
  >
    {cardFrameView()}
    {cardTitleView({ product })}
    {cardTaglineView({
      product,
      quickLabel: hasQuickLink
        ? pipe(
            quickLinkOf(product),
            O.map((link) => link.label),
          )
        : O.none,
    })}
    <div className='absolute inset-x-[30cqw] inset-y-[36cqw] flex items-center justify-center'>
      {logoView({ product })}
    </div>
    {/* Sunlight on the paper, over the print as on a real card: a shade on
        the side turned away, and the glare of the sun */}
    <div className='card-shade pointer-events-none absolute inset-0' />
    <div className='card-glare pointer-events-none absolute inset-[-50%]' />
  </div>
)
