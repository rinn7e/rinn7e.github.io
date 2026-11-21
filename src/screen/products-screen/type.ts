import * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as B from 'fp-ts/boolean'
import * as N from 'fp-ts/number'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

import * as ProductPopup from './product-popup'

export type Model = {
  // The popup of the product opened, none when every product shows as its
  // card. It is a param of the destination, and the URL follows it.
  readonly popup: Option<ProductPopup.Model>
  // Counts the opens, to give each popup its own `seq`
  readonly seq: number
  // Every card shows its back (the Flip button, the debug panel)
  readonly isFlipped: boolean
  // The cards come in with a short fade only when this screen is the first
  // the visitor sees, until a card comes back from the popup; a switch of
  // tab or category shows them at once
  readonly isFirstShow: boolean
  // The category the cards are filtered to: a param of the destination, set
  // by `init` (a highlight of the profile is a link to it)
  readonly category: Option<ProductCategory>
}

export type Msg =
  // `from`: where the card was clicked, none to open with no animation
  // (reduced motion)
  | {
      readonly _tag: 'OpenProduct'
      readonly id: string
      readonly from: Option<ProductPopup.CardRect>
    }
  | { readonly _tag: 'ProductPopupMsg'; readonly subMsg: ProductPopup.Msg }
  // From the Flip button and the debug panel, through the app
  | { readonly _tag: 'FlipAll' }
  | { readonly _tag: 'UnflipAll' }

export const ModelEq: EqClass.Eq<Model> = EqClass.struct({
  popup: O.getEq(ProductPopup.ModelEq),
  seq: N.Eq,
  isFlipped: B.Eq,
  isFirstShow: B.Eq,
  category: O.getEq(S.Eq),
})

export type Props = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the app passes sends the same message
// whatever the model
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) => ModelEq.equals(x.model, y.model),
}
