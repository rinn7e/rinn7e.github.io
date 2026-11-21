import { ProgramWithNav } from 'react-tea-cup'
import { type Dispatcher, Sub } from 'tea-cup-fp'

import { type Model, type Msg } from './type'
import { init, update } from './update'
import { urlChangedMsg, withUrl } from './util'
import { RootView } from './view'

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <RootView model={model} dispatch={dispatch} />
)

// Every step goes through `withUrl`, the one wrapper around `update`: the
// URL follows the destination the step leaves
const appUpdate = (msg: Msg, model: Model) =>
  withUrl(msg, model, update(msg, model))

export const AppProgram = () => (
  <ProgramWithNav<Model, Msg>
    // The browser's back and forward (the app's own URL writes fire no
    // `popstate`)
    onUrlChange={urlChangedMsg}
    init={init}
    update={appUpdate}
    view={appView}
    subscriptions={() => Sub.none()}
  />
)
