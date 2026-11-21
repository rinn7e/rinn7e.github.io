import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import { Cmd, Task } from 'tea-cup-fp'

export type NoOpMsg = { readonly _tag: 'NoOp' }

const noOpMsg = (): NoOpMsg => ({ _tag: 'NoOp' })

// Runs `effect` as a command that answers with `NoOp`: the way a side effect
// (the URL, the scroll) leaves an `update`, which stays pure
export const cmdSucceed = (effect: () => void): Cmd<NoOpMsg> =>
  Task.perform<void, NoOpMsg>(Task.succeedLazy(effect), noOpMsg)

// Runs `func` on the model a step left and batches its command after the
// step's own, for steps chained in a `pipe`
export const updateAndCmd =
  <Msg, Model>(func: (model: Model) => [Model, Cmd<Msg>]) =>
  ([model, cmd]: [Model, Cmd<Msg>]): [Model, Cmd<Msg>] => {
    const [updatedModel, nextCmd] = func(model)
    return [updatedModel, Cmd.batch([cmd, nextCmd])]
  }

// Adds `url` to the history as a new entry (no `popstate` fires for it)
export const pushUrlCmd = (url: string): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    window.history.pushState(null, '', url)
  })

// Changes the history entry shown to `url` (no `popstate` fires for it)
export const replaceUrlCmd = (url: string): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    window.history.replaceState(null, '', url)
  })

// A move to another screen starts at its top, as a page load would
export const scrollToTopCmd = (): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    window.scrollTo({ top: 0 })
  })

// Browsers throttle `requestAnimationFrame` in hidden tabs (down to about
// 1s), so a wait for a paint gives up after this
const maxPaintWaitMs = 100

const afterNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
    window.setTimeout(resolve, maxPaintWaitMs)
  })

// Reads the page after the next paint (`read`, a measure of the layout just
// rendered) and answers with `toMsg` of what it read, none when the read
// threw: the step between a render and a transition that starts from it
export const afterNextPaintCmd = <R, M>(
  read: () => R,
  toMsg: (r: Option<R>) => M,
): Cmd<M> =>
  Task.attempt(
    Task.fromPromise(() => afterNextPaint().then(read)),
    (result) => toMsg(result.tag === 'Ok' ? O.some(result.value) : O.none),
  )

// Answers with `msg` after `ms`: the end of a transition
export const delayCmd = <M>(ms: number, msg: M): Cmd<M> =>
  Task.attempt(
    Task.fromPromise(
      () => new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
    ),
    () => msg,
  )
