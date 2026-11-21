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
} from '@/common/data/product'
import { prefersReducedMotion } from '@/common/util'

import { ProductCardMemo } from '../common/product-card/component'
import { gridCardDomId } from '../common/product-card/dom-id'
import { type Msg } from '../type'
import { type Props, PropsEq } from './type'

// Every product as its card in a grid under the profile, dealt one after
// the other on the first load: six a row across the page at most (each
// column at least a sixth of it), at least 150px each, so fewer on a
// narrower screen. A highlight filters the cards to its category. The card
// of the product opened is away in the popup: its cell keeps the room, so
// the grid does not move.

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
    />
  </button>
)

const ProductGrid = ({
  category,
  away,
  isFlipped,
  isFirstShow,
  dispatch,
}: Props) => (
  <ul className='grid grid-cols-[repeat(auto-fill,minmax(max(9.375rem,calc((100%-5px)/6)),1fr))] gap-[1px] pt-[1px] pb-[6rem]'>
    {pipe(
      productList,
      RA.filter(isInCategory(category)),
      RA.mapWithIndex((index, product) => (
        <li
          key={product.id}
          style={{ '--deal-index': index }}
          className={[
            'p-[0.5rem] lg:p-[0.75rem]',
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
