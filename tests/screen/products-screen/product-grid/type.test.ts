import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import {
  PropsEq as ProductGridPropsEq,
  type Props,
} from '@/screen/products-screen/product-grid'

const base: Props = {
  category: O.none,
  away: O.none,
  isFlipped: false,
  isFirstShow: true,
  dispatch: () => undefined,
}

describe('when the grid draws again', () => {
  it('does not draw again for a new dispatch', () => {
    expect(
      ProductGridPropsEq.equals(base, { ...base, dispatch: () => undefined }),
    ).toBe(true)
  })

  it('draws again on a change of what it shows', () => {
    expect(
      ProductGridPropsEq.equals(base, { ...base, category: O.some('Game') }),
    ).toBe(false)
    expect(
      ProductGridPropsEq.equals(base, { ...base, away: O.some('damn-center') }),
    ).toBe(false)
    expect(ProductGridPropsEq.equals(base, { ...base, isFlipped: true })).toBe(
      false,
    )
    expect(
      ProductGridPropsEq.equals(base, { ...base, isFirstShow: false }),
    ).toBe(false)
  })
})
