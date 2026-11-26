import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import React from 'react'

import { type Product, quickLinkOf } from '@/common/data/product'
import { newTabProps } from '@/common/util'

import {
  cardLayerAttr,
  releasePointerThroughLayer,
  trackPointerThroughLayer,
} from './pointer'

// The footer of a card links straight to the product (`quickLinkOf`), so a
// visitor need not open the card first: a layer over the footer band (the
// bottom 17 of the 140 units of the card), a sibling of the card button, as
// a link cannot sit in a button. Both go in a `group/card` box: the card
// draws where the footer goes while the box is hovered, and the layer
// passes the pointer on, so the card keeps its tilt. A card turned over or
// in flight has none (`isShown`).
export const quickLinkLayerView = ({
  product,
  isShown,
}: {
  readonly product: Product
  readonly isShown: boolean
}) =>
  !isShown
    ? null
    : pipe(
        quickLinkOf(product),
        O.fold(
          () => null,
          (link) => (
            <a
              {...newTabProps}
              {...{ [cardLayerAttr]: '' }}
              href={link.url}
              aria-label={`${link.label}: ${product.name}`}
              className='absolute inset-x-[0] bottom-[0] h-[12.15%] rounded-b-[1.125rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100'
              onPointerMove={trackPointerThroughLayer}
              onPointerLeave={releasePointerThroughLayer}
              onClick={(event) => {
                // The page is the same for every browser, so the click
                // picks the store of the browser it is in
                if (
                  O.isSome(link.firefoxUrl) &&
                  navigator.userAgent.includes('Firefox')
                ) {
                  event.currentTarget.href = link.firefoxUrl.value
                }
              }}
            />
          ),
        ),
      )
