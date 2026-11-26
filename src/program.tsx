import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Program } from 'react-tea-cup'
import { Cmd, type Dispatcher, Task } from 'tea-cup-fp'

import { popStateSub, savedScrollOfEntry } from '@/common/util'
import { bootOf } from '@/common/util/boot'

import { type Model, type Msg } from './type'
import { init, update } from './update'
import { urlChangedMsg, urlWriterOf } from './util'
import { RootView } from './view'

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <RootView model={model} dispatch={dispatch} />
)

// The URL follows the destination of every step, written by the listener
// of the program before React draws the step (`urlWriterOf`). One for the
// app, so it keeps the model of the step before across renders.
const urlWriter = urlWriterOf()

// The real time of the browser, after a first render drawn with the time a
// page was rendered with ahead of time
const setNowCmd: Cmd<Msg> = Task.perform(
  Task.succeedLazy(() => Date.now()),
  (now): Msg => ({ _tag: 'SetNow', now }),
)

// A page rendered ahead of time (`src/prerender.tsx`) boots with the time it
// was rendered with, so the first render matches its HTML and React hydrates
// it (`src/root.tsx`); any other page boots with the time of the browser.
// The time is read here, so `init` stays pure.
const bootInit = (location: Location): [Model, Cmd<Msg>] =>
  pipe(
    bootOf(document),
    O.fold(
      () => init(location, Date.now(), savedScrollOfEntry()),
      (boot) => {
        const [model, cmd] = init(location, boot.now, savedScrollOfEntry())
        return [model, Cmd.batch([cmd, setNowCmd])]
      },
    ),
  )

export const AppProgram = () => (
  <Program<Model, Msg>
    init={() => bootInit(window.location)}
    // The first render draws the model of `init`, so React can hydrate the
    // HTML of a page rendered ahead of time (the patch of
    // `patches/react-tea-cup@5.1.3.patch`)
    initOnFirstRender
    update={update}
    listener={urlWriter}
    view={appView}
    // The browser's back and forward (the app's own URL writes fire no
    // `popstate`)
    subscriptions={() => popStateSub(urlChangedMsg)}
  />
)
