import { type Cmd, Task } from 'tea-cup-fp'

export type NoOpMsg = { readonly _tag: 'NoOp' }

const noOpMsg = (): NoOpMsg => ({ _tag: 'NoOp' })

// Runs `effect` as a command that answers with `NoOp`: the way a side effect
// (the URL, the scroll) leaves an `update`, which stays pure
export const cmdSucceed = (effect: () => void): Cmd<NoOpMsg> =>
  Task.perform<void, NoOpMsg>(Task.succeedLazy(effect), noOpMsg)

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
