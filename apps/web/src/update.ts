import { Cmd, Task } from 'tea-cup-fp'

import {
  type RedEyeStyle,
  initialRedEyeStyle,
  saveRedEyeStyle,
} from './red-eye-style'
import {
  type Theme,
  applyTheme,
  initialTheme,
  otherTheme,
  saveTheme,
} from './theme'
import { type Model, type Msg } from './type'

export const init = (): [Model, Cmd<Msg>] => [
  {
    theme: initialTheme(),
    screen2: false,
    redEyeStyle: initialRedEyeStyle(),
  },
  Cmd.none(),
]

// Keeps the choice for the next visit and switches the page to it
const themeCmd = (theme: Theme): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      saveTheme(theme)
      applyTheme(theme)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

export const handleToggleTheme = (model: Model): Model => ({
  ...model,
  theme: otherTheme(model.theme),
})

// Keeps the style of the red eye for the next visit
const redEyeStyleCmd = (style: RedEyeStyle): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      saveRedEyeStyle(style)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

export const handleSetRedEyeStyle = (
  model: Model,
  style: RedEyeStyle,
): Model => ({ ...model, redEyeStyle: style })

// Opens or closes screen 2
export const handleScreen2 = (model: Model, open: boolean): Model => ({
  ...model,
  screen2: open,
})

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'ToggleTheme': {
      const next = handleToggleTheme(model)
      return [next, themeCmd(next.theme)]
    }
    case 'NoOp':
      return [model, Cmd.none()]
    case 'OpenScreen2':
      return [handleScreen2(model, true), Cmd.none()]
    case 'CloseScreen2':
      return [handleScreen2(model, false), Cmd.none()]
    case 'SetRedEyeStyle':
      return [handleSetRedEyeStyle(model, msg.style), redEyeStyleCmd(msg.style)]
  }
}
