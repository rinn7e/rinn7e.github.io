import type * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as B from 'fp-ts/boolean'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

import { type Msg } from '../type'

export type Props = {
  readonly category: Option<ProductCategory>
  // The product whose card is away in the popup
  readonly away: Option<string>
  readonly isFlipped: boolean
  readonly isFirstShow: boolean
  readonly dispatch: Dispatcher<Msg>
}

// What the grid draws, not the popup: a step of the popup's animation or a
// new screenshot does not draw the grid again. `dispatch` is left out (the
// one the screen passes sends the same message whatever the model).
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) =>
    O.getEq(S.Eq).equals(x.category, y.category) &&
    O.getEq(S.Eq).equals(x.away, y.away) &&
    B.Eq.equals(x.isFlipped, y.isFlipped) &&
    B.Eq.equals(x.isFirstShow, y.isFirstShow),
}
