import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import {
  aboutScreen,
  notFoundScreen,
  privacyScreen,
  productsScreen,
} from '@/common/type/destination'
import { headerScreenOf } from '@/component/profile-header'

describe('the header of each screen', () => {
  it('gives the cards their category and side, and no other screen either', () => {
    expect(
      headerScreenOf(productsScreen(O.none, O.some('Game')), true),
    ).toEqual({
      _tag: 'ProductsHeader',
      category: O.some('Game'),
      isFlipped: true,
    })
    expect(headerScreenOf(aboutScreen(), true)).toEqual({ _tag: 'AboutHeader' })
    expect(headerScreenOf(privacyScreen(), true)).toEqual({
      _tag: 'NoTabHeader',
    })
    expect(headerScreenOf(notFoundScreen(), false)).toEqual({
      _tag: 'NoTabHeader',
    })
  })
})
