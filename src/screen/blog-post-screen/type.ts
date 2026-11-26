import * as EqClass from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type BlogPost } from '@/common/type/blog-post'

// The post shown. It comes from the build and never changes while it shows,
// so its messages are empty: a feature on it starts from this frame.
export type Model = {
  readonly post: BlogPost
}

// A post is known by its slug: two models of the same post draw the same
// page. A field added to the model must be added here too.
export const ModelEq: EqClass.Eq<Model> = EqClass.struct({
  post: pipe(
    S.Eq,
    EqClass.contramap((post: BlogPost) => post.slug),
  ),
})

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
