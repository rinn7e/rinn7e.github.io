import * as EqClass from 'fp-ts/Eq'
import * as B from 'fp-ts/boolean'
import { type Dispatcher } from 'tea-cup-fp'

export type Model = {
  // The panel is folded to its button until opened
  readonly isOpen: boolean
}

// `FlipAllCards` and `UnflipAllCards` are asks for the app: the app
// intercepts them and passes them to the products screen
export type Msg =
  | { readonly _tag: 'TogglePanel' }
  | { readonly _tag: 'FlipAllCards' }
  | { readonly _tag: 'UnflipAllCards' }

export const ModelEq: EqClass.Eq<Model> = EqClass.struct({ isOpen: B.Eq })

export type Props = {
  readonly model: Model
  // The buttons act on the products screen, so they wait for it
  readonly isProductsScreen: boolean
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the app passes sends the same message
// whatever the model
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) =>
    ModelEq.equals(x.model, y.model) &&
    x.isProductsScreen === y.isProductsScreen,
}
