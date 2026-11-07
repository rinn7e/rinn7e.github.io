import { Program } from 'react-tea-cup'
import { type Dispatcher, type Sub } from 'tea-cup-fp'

import { App } from './app'
import { onMediaQuery } from './media-query-events'
import { type Model, type Msg } from './type'
import { init, update } from './update'

// The OS setting, followed by the page while the theme choice is auto. A new
// Sub on every update: Program starts the new one before it releases the old
const osThemeChanges = (): Sub<Msg> =>
  onMediaQuery<Msg>('(prefers-color-scheme: dark)', (e) => ({
    _tag: 'OsThemeChanged',
    theme: e.matches ? 'dark' : 'light',
  }))

const appView = (dispatch: Dispatcher<Msg>, model: Model) => (
  <App model={model} dispatch={dispatch} />
)

export const AppProgram = () => (
  <Program<Model, Msg>
    init={init}
    update={update}
    view={appView}
    subscriptions={osThemeChanges}
  />
)
