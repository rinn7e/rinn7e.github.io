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
}

const ProductCardPropsEq = (x: ProductCardProps, y: ProductCardProps) =>
  x.product.id === y.product.id &&
  x.size === y.size &&
  x.isFlipped === y.isFlipped

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
  ;['--card-rx', '--card-ry', '--card-mx', '--card-my', '--card-hover'].forEach(
    (name) => element.style.removeProperty(name),
  )
}

// A square holo card: its front is only the logo of the product on white,
// under a foil and a glare that follow the pointer; its back is white
// with a black pattern, seen while the card spins.
// The pointer is tracked on the outer box, which never tilts: tracked on the
// card itself, an edge would tilt away from under the pointer, end the hover
// and flatten the card again, so only its middle would respond. The CSS
// variables set there pass down to the card.
const ProductCard = ({ product, size, isFlipped }: ProductCardProps) => (
  <div
    onPointerMove={trackPointer}
    onPointerLeave={releasePointer}
    data-flipped={isFlipped}
    className={`${sizeClassOf(size)} [container-type:inline-size] [transform-style:preserve-3d]`}
  >
    <div className='card-tilt relative size-full'>
      {/* Front */}
      <div
        style={{ '--card-color': product.color }}
        className='card-edge absolute inset-0 overflow-hidden rounded-[4.5cqw] bg-white [backface-visibility:hidden]'
      >
        {/* The silver foil is the face behind the print, as on a foil card:
            the frame, the corners and the logo stay crisp on top of it */}
        <div className='card-silver pointer-events-none absolute inset-0' />
        {cardFrameView()}
        {cardTitleView({ product })}
        {cardTaglineView({ product })}
        <div className='absolute inset-x-[30cqw] inset-y-[36cqw] flex items-center justify-center'>
          {logoView({ product })}
        </div>
        <div className='card-gloss pointer-events-none absolute inset-0' />
      </div>
      {/* Back */}
      <div className='card-edge absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-[4.5cqw] bg-white [backface-visibility:hidden]'>
        {cardBackView()}
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

// The back: a fine black diamond lattice on white under a black symmetric
// emblem (rings,
// an eight-pointed star and a diamond at each corner). Every shape comes from
// one point list turned around the centre, so the halves mirror exactly.
const BACK_CX = 50
const BACK_CY = 70

const pointAt = (radius: number, angleDeg: number): string => {
  const angle = (angleDeg * Math.PI) / 180
  const x = BACK_CX + radius * Math.sin(angle)
  const y = BACK_CY - radius * Math.cos(angle)
  return `${x.toFixed(2)},${y.toFixed(2)}`
}

// A star of `points` tips, alternating between the outer and inner radius
const starPoints = (points: number, outer: number, inner: number): string =>
  pipe(
    RA.makeBy(points * 2, (index) =>
      pointAt(index % 2 === 0 ? outer : inner, (index * 180) / points),
    ),
    RA.intercalate(S.Monoid)(' '),
  )

const cornerDiamond = (cx: number, cy: number, r: number): string =>
  `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`

const cardBackView = () => (
  <div className='relative size-full bg-[repeating-linear-gradient(45deg,rgb(0_0_0/0.07)_0_1px,transparent_1px_0.7em),repeating-linear-gradient(-45deg,rgb(0_0_0/0.07)_0_1px,transparent_1px_0.7em)]'>
    <svg
      viewBox='0 0 100 140'
      aria-hidden='true'
      className='absolute inset-0 size-full'
      fill='none'
      stroke='#0c1014'
    >
      <rect
        x='5'
        y='5'
        width='90'
        height='130'
        rx='4'
        strokeOpacity='0.35'
        strokeWidth='0.6'
      />
      <circle cx='50' cy='70' r='34' strokeOpacity='0.18' strokeWidth='0.5' />
      <circle cx='50' cy='70' r='29' strokeOpacity='0.3' strokeWidth='0.5' />
      <polygon
        points={starPoints(8, 27, 13)}
        strokeOpacity='0.75'
        strokeWidth='0.7'
        fill='white'
      />
      <polygon
        points={starPoints(4, 16, 6)}
        strokeOpacity='0.5'
        strokeWidth='0.5'
      />
      <circle
        cx='50'
        cy='70'
        r='6.5'
        strokeOpacity='0.9'
        strokeWidth='0.8'
        fill='white'
      />
      <circle cx='50' cy='70' r='2' fill='#0c1014' stroke='none' />
      {pipe(
        [
          [14, 14],
          [86, 14],
          [14, 126],
          [86, 126],
        ],
        RA.map(([cx, cy]) => (
          <polygon
            key={`${cx}-${cy}`}
            points={cornerDiamond(cx, cy, 3)}
            strokeOpacity='0.6'
            strokeWidth='0.5'
          />
        )),
      )}
    </svg>
  </div>
)
