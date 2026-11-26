import * as EqClass from 'fp-ts/Eq'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

// The posts come from the build (`src/common/data/blog.ts`), so its model and
// its messages are empty: a feature on it (a tag filter) starts from this frame
export type Model = Record<string, never>

// A field added to the model must be added here too, or this fails to type
// check, so the screen never skips a draw it needs
export const ModelEq: EqClass.Eq<Model> = EqClass.struct({})

export type Msg = { readonly _tag: 'NoOp' }

export type Props = {
  readonly model: Model
  // The first day a post still counts as new (the badge New), from the
  // root model
  readonly newSince: string
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the app passes sends the same message
// whatever the model
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) =>
    ModelEq.equals(x.model, y.model) && S.Eq.equals(x.newSince, y.newSince),
}
