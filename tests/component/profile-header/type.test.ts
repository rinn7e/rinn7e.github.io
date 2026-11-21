import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { type ProductCategory } from '@/common/data/product'
import {
  aboutScreen,
  privacyScreen,
  productsScreen,
} from '@/common/type/destination'
import {
  type HeaderScreen,
  type Props,
  PropsEq,
  headerScreenOf,
} from '@/component/profile-header'

const propsOf = (headerScreen: HeaderScreen): Props => ({
  headerScreen,
  dispatch: () => undefined,
})

describe('when the header draws again', () => {
  const products = (
    category: Option<ProductCategory> = O.none,
    isFlipped = false,
  ) => propsOf(headerScreenOf(productsScreen(O.none, category), isFlipped))

  it('does not draw again when a product opens', () => {
    expect(
      PropsEq.equals(
        products(),
        propsOf(headerScreenOf(productsScreen(O.some('damn-center')), false)),
      ),
    ).toBe(true)
  })

  it('draws again on a change of category, side or tab', () => {
    expect(PropsEq.equals(products(), products(O.some('Game')))).toBe(false)
    expect(PropsEq.equals(products(), products(O.none, true))).toBe(false)
    expect(
      PropsEq.equals(products(), propsOf(headerScreenOf(aboutScreen(), false))),
    ).toBe(false)
    expect(
      PropsEq.equals(
        propsOf(headerScreenOf(aboutScreen(), false)),
        propsOf(headerScreenOf(privacyScreen(), false)),
      ),
    ).toBe(false)
  })
})
