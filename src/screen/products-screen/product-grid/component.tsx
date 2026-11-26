import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import React, { memo } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import {
  type Product,
  type ProductCategory,
  productList,
  quickLinkOf,
} from '@/common/data/product'
import { prefersReducedMotion } from '@/common/util'

import { ProductCardMemo } from '../common/product-card/component'
import { gridCardDomId } from '../common/product-card/dom-id'
import { quickLinkLayerView } from '../common/product-card/quick-link'
import { type Msg } from '../type'
import { type Props, PropsEq } from './type'

// Every product as its card in rows under the profile, dealt one after
// the other on the first load: six a row across the page at most (each
// card a sixth of it), at least 150px each, so fewer on a narrower screen.
// A row that is not full is centred. A highlight filters the cards to its
// category. The card of the product opened is away in the popup: its cell
// keeps the room, so the rows do not move.

// The width of a cell: as many columns of at least 150px (9.375rem) as fit
// with the 1px gaps, sharing the row; a column fits from 151px x n - 1px of
// row width, and from 905px on, six share it
const cellWidthClassName = [
  'w-full',
  '@min-[18.8125rem]:w-[calc((100%-1px)/2)]',
  '@min-[28.25rem]:w-[calc((100%-2px)/3)]',
  '@min-[37.6875rem]:w-[calc((100%-3px)/4)]',
  '@min-[47.125rem]:w-[calc((100%-4px)/5)]',
  '@min-[56.5625rem]:w-[calc((100%-5px)/6)]',
].join(' ')

const isInCategory =
  (category: Option<ProductCategory>) =>
  (product: Product): boolean =>
    pipe(
      category,
      O.fold(
        () => true,
        (c) => RA.elem(S.Eq)(c)(product.categoryList),
      ),
    )

const gridCardView = ({
  product,
  isFlipped,
  dispatch,
}: {
  readonly product: Product
  readonly isFlipped: boolean
  readonly dispatch: Dispatcher<Msg>
}) => (
  <div className='group/card relative'>
    <button
      type='button'
      id={gridCardDomId(product.id)}
      aria-label={`Open ${product.name}`}
      className='block w-full rounded-[1.125rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100'
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        dispatch({
          _tag: 'OpenProduct',
          id: product.id,
          from: prefersReducedMotion()
            ? O.none
            : O.some({ left: rect.left, top: rect.top, width: rect.width }),
        })
      }}
    >
      <ProductCardMemo
        product={product}
        size='ColumnCard'
        isFlipped={isFlipped}
        isTracked
        hasQuickLink={O.isSome(quickLinkOf(product))}
      />
    </button>
    {quickLinkLayerView({ product, isShown: !isFlipped })}
  </div>
)

const ProductGrid = ({
  category,
  away,
  isFlipped,
  isFirstShow,
  dispatch,
}: Props) => (
  <ul className='@container flex flex-wrap justify-center gap-[1px] pt-[1rem] pb-[6rem] lg:pt-[2rem]'>
    {pipe(
      productList,
      RA.filter(isInCategory(category)),
      RA.mapWithIndex((index, product) => (
        <li
          key={product.id}
          style={{ '--deal-index': index }}
          className={[
            'p-[0.5rem] lg:p-[0.75rem]',
            cellWidthClassName,
            // Away in the popup: the cell keeps its room
            O.elem(S.Eq)(product.id, away) ? 'invisible' : '',
            isFirstShow ? 'deal-in' : '',
          ].join(' ')}
        >
          {gridCardView({ product, isFlipped, dispatch })}
        </li>
      )),
    )}
  </ul>
)

export const ProductGridMemo = memo(ProductGrid, PropsEq.equals)
