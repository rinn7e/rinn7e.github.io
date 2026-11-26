import React, { memo } from 'react'

import { cardBackView } from './card-back'
import { cardFrontView } from './card-front'
import { releasePointer, trackPointer } from './pointer'
import { type ProductCardSize, type Props, PropsEq } from './type'

// A card is portrait, 5:7 like a playing card. A column card fills the
// width of its grid cell; a panel card has a fixed width. Every size inside
// is in `cqw` (a share of the card width), so one card scales to any size.
const sizeClassOf = (size: ProductCardSize): string => {
  switch (size) {
    case 'ColumnCard':
      return 'w-full aspect-[5/7]'
    case 'PanelCard':
      // On a desktop, the size of a card in the grid of a wide screen
      return 'w-[7.5rem] aspect-[5/7] lg:w-[13.6rem]'
  }
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
  hasQuickLink,
}: Props) => (
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
      {cardFrontView({ product, hasQuickLink })}
      {cardBackView({ product })}
    </div>
  </div>
)

export const ProductCardMemo = memo(ProductCard, PropsEq.equals)
