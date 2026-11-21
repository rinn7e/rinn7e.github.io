import * as EqClass from 'fp-ts/Eq'
import { type Dispatcher } from 'tea-cup-fp'

// Static for now, so its model and its messages are empty: a feature on it
// starts from this frame
export type Model = Record<string, never>

// A field added to the model must be added here too, or this fails to type
// check, so the screen never skips a draw it needs
export const ModelEq: EqClass.Eq<Model> = EqClass.struct({})

export type Msg = { readonly _tag: 'NoOp' }

export type Props = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the app passes sends the same message
// whatever the model
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) => ModelEq.equals(x.model, y.model),
}
