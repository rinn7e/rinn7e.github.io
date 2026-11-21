import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import React, { memo } from 'react'

import { type Product } from '@/common/data/product'
import { categoryIconView } from '@/component/category'

export type ProductCardSize = 'ColumnCard' | 'PanelCard'

export type ProductCardProps = {
  readonly product: Product
  readonly size: ProductCardSize
  // Turned over to show its back (from the debug panel)
  readonly isFlipped: boolean
  // Tilts and catches the light under the pointer; off while the card flies,
  // so the hover never fights the flight
  readonly isTracked: boolean
}

const ProductCardPropsEq = (x: ProductCardProps, y: ProductCardProps) =>
  x.product.id === y.product.id &&
  x.size === y.size &&
  x.isFlipped === y.isFlipped &&
  x.isTracked === y.isTracked

// A card is portrait, 5:7 like a playing card. A column card fills the
// width of its grid cell; a panel card has a fixed width. Every size inside is in `cqw` (a share of the card width), so one
// card scales to any size.
const sizeClassOf = (size: ProductCardSize): string => {
  switch (size) {
    case 'ColumnCard':
      return 'w-full aspect-[5/7]'
    case 'PanelCard':
      // On a desktop, the size of a card in the grid of a wide screen
      return 'w-[7.5rem] aspect-[5/7] lg:w-[13.6rem]'
  }
}

// The tilt and shine follow the pointer. They are presentation only, like a
// hover color, so they live in CSS variables, not in the model: nothing
// waits for them.
const MAX_TILT_DEG = 16

const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === 'touch') {
    // A finger scrolls the page; the card stays flat
  } else {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    element.dataset.tracking = 'true'
    element.style.setProperty('--card-ry', `${(x - 0.5) * MAX_TILT_DEG}deg`)
    element.style.setProperty('--card-rx', `${(0.5 - y) * MAX_TILT_DEG}deg`)
    element.style.setProperty('--card-mx', `${x * 100}%`)
    element.style.setProperty('--card-my', `${y * 100}%`)
    element.style.setProperty('--card-nx', `${(x - 0.5) * 2}`)
    element.style.setProperty('--card-ny', `${(y - 0.5) * 2}`)
    element.style.setProperty('--card-hover', '1')
  }
}

const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
  const element = event.currentTarget
  element.dataset.tracking = 'false'
  ;[
    '--card-rx',
    '--card-ry',
    '--card-mx',
    '--card-my',
    '--card-nx',
    '--card-ny',
    '--card-hover',
  ].forEach((name) => element.style.removeProperty(name))
}

// A playing card: its front is the logo of the product on white paper, lit
// by the sun as it tilts under the pointer; its back is the word rinn7e in
// diagonal rows, seen while the card spins.
// The pointer is tracked on the outer box, which never tilts: tracked on the
// card itself, an edge would tilt away from under the pointer, end the hover
// and flatten the card again, so only its middle would respond. The CSS
// variables set there pass down to the card.
const ProductCard = ({
  product,
  size,
  isFlipped,
  isTracked,
}: ProductCardProps) => (
  <div
    onPointerMove={isTracked ? trackPointer : undefined}
    onPointerLeave={isTracked ? releasePointer : undefined}
    data-flipped={isFlipped}
    data-tracked={isTracked}
    className={[
      sizeClassOf(size),
      '[container-type:inline-size] [transform-style:preserve-3d]',
      // Not tracked (in flight): the pointer goes through, unseen
      isTracked ? '' : 'pointer-events-none',
    ].join(' ')}
  >
    <div className='card-tilt relative size-full'>
      {/* Front */}
      <div
        style={{ '--card-color': product.color }}
        className='card-edge absolute inset-0 overflow-hidden rounded-[4.5cqw] bg-white [backface-visibility:hidden]'
      >
        {cardFrameView()}
        {cardTitleView({ product })}
        {cardTaglineView({ product })}
        <div className='absolute inset-x-[30cqw] inset-y-[36cqw] flex items-center justify-center'>
          {logoView({ product })}
        </div>
        {/* Sunlight on the paper, over the print as on a real card: a
            shade on the side turned away, and the glare of the sun */}
        <div className='card-shade pointer-events-none absolute inset-0' />
        <div className='card-glare pointer-events-none absolute inset-[-50%]' />
      </div>
      {/* Back */}
      <div className='card-edge absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-[4.5cqw] bg-white [backface-visibility:hidden]'>
        {cardBackView({ product })}
      </div>
    </div>
  </div>
)

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
      stroke='var(--card-color)'
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
  <div className='absolute inset-x-[0] top-[0] flex h-[17cqw] items-center justify-between gap-[3cqw] px-[7cqw] text-[var(--card-color)]'>
    <p className='min-w-0 truncate text-left text-[7cqw] leading-[1.2] font-semibold'>
      {product.cardName}
    </p>
    {suitView({ product })}
  </div>
)

const cardTaglineView = ({ product }: { readonly product: Product }) => (
  <div className='absolute inset-x-[0] bottom-[0] flex h-[17cqw] items-center justify-between gap-[3cqw] px-[7cqw] text-[var(--card-color)]'>
    {suitView({ product })}
    <p className='min-w-0 truncate text-right text-[5.4cqw] leading-[1.2] font-normal opacity-85'>
      {product.cardTagline}
    </p>
  </div>
)

export const ProductCardMemo = memo(ProductCard, ProductCardPropsEq)

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
          className='text-[19cqw] leading-none font-bold text-[var(--card-color)]'
        >
          {logo.letters}
        </span>
      )
  }
}

// The back, after the back of a real deck: a white margin around a panel
// framed by a thin rule, in the color of the product as on its front.
// Instead of a pattern, the panel is filled with the word rinn7e, repeated
// in bold italic rows that run on a diagonal, every other row shifted by half a word and drawn lighter, like
// a logo knitted into a fabric. The panel is a nested svg, which clips its
// rows without an id, so the many cards on a page share none.
const BACK_WORD = 'rinn7e'
const BACK_ROW_TEXT = pipe(
  RA.replicate(8, BACK_WORD),
  RA.intercalate(S.Monoid)(' '),
)

// The rows, top to bottom, wide and tall enough to cover the panel once
// turned
const backRowList: ReadonlyArray<number> = RA.makeBy(19, (index) => index)

const cardBackView = ({ product }: { readonly product: Product }) => (
  <div className='relative size-full bg-white'>
    <svg
      viewBox='0 0 100 140'
      aria-hidden='true'
      className='absolute inset-0 size-full'
    >
      <svg x='8' y='8' width='84' height='124' viewBox='0 0 84 124'>
        <g
          transform='rotate(-30 42 62)'
          fill={product.color}
          fontSize='11'
          fontStyle='italic'
          fontWeight='900'
          letterSpacing='-0.4'
        >
          {pipe(
            backRowList,
            RA.map((index) => (
              <text
                key={index}
                x={index % 2 === 0 ? -60 : -78}
                y={-30 + index * 11}
                fillOpacity={index % 2 === 0 ? 1 : 0.3}
              >
                {BACK_ROW_TEXT}
              </text>
            )),
          )}
        </g>
      </svg>
      <rect
        x='8'
        y='8'
        width='84'
        height='124'
        rx='2'
        fill='none'
        stroke={product.color}
        strokeWidth='0.8'
      />
    </svg>
  </div>
)
