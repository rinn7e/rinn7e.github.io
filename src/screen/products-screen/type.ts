import * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

export type Model = {
  // The category filter, none for every product. A param of the
  // destination: the URL follows it after each step.
  readonly category: Option<ProductCategory>
}

export type Msg = {
  readonly _tag: 'SelectCategory'
  readonly category: Option<ProductCategory>
}

export const ModelEq: EqClass.Eq<Model> = EqClass.struct({
  category: O.getEq(S.Eq),
})

export type Props = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: tea-cup gives a stable one for the screen
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) => ModelEq.equals(x.model, y.model),
}
