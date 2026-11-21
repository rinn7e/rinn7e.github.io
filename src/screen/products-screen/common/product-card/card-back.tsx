import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import React from 'react'

import { type Product } from '@/common/data/product'

// The back, after the back of a real deck: a white margin around a panel
// framed by a thin rule, in the color of the product as on its front.
// Instead of a pattern, the panel is filled with the word rinn7e, repeated
// in bold italic rows that run on a diagonal, every other row shifted by
// half a word and drawn lighter, like a logo knitted into a fabric. The
// panel is a nested svg, which clips its rows without an id, so the many
// cards on a page share none.
const BACK_WORD = 'rinn7e'
const BACK_ROW_TEXT = pipe(
  RA.replicate(8, BACK_WORD),
  RA.intercalate(S.Monoid)(' '),
)

// The rows, top to bottom, wide and tall enough to cover the panel once
// turned
const backRowList: ReadonlyArray<number> = RA.makeBy(19, (index) => index)

export const cardBackView = ({ product }: { readonly product: Product }) => (
  <div className='card-edge absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-[4.5cqw] bg-white [backface-visibility:hidden]'>
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
