import { Cmd, Task } from 'tea-cup-fp'

import {
  type RedEyeStyle,
  initialRedEyeStyle,
  saveRedEyeStyle,
} from './red-eye-style'
import {
  type Theme,
  type ThemeChoice,
  applyTheme,
  loadThemeChoice,
  nextThemeChoice,
  osTheme,
  resolveTheme,
  saveThemeChoice,
} from './theme'
import { type Model, type Msg } from './type'

// How long the buttons over the page stay after they show, in milliseconds
export const OVERLAY_MS = 3000

// Hides the buttons over the page OVERLAY_MS from now, unless they show again
// before (a newer `timer`)
const hideOverlayCmd = (timer: number): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(
      () => new Promise<void>((resolve) => setTimeout(resolve, OVERLAY_MS)),
    ),
    (): Msg => ({ _tag: 'HideOverlay', timer }),
  )

export const init = (): [Model, Cmd<Msg>] => [
  {
    themeChoice: loadThemeChoice(),
    osTheme: osTheme(),
    screen2: false,
    switching: false,
    redEyeStyle: initialRedEyeStyle(),
    // The buttons over the page start hidden, so the face shows alone
    overlay: false,
    overlayTimer: 0,
  },
  Cmd.none(),
]

// The theme the page shows
export const themeOf = (model: Model): Theme =>
  resolveTheme(model.themeChoice, model.osTheme)

// Switches the page to a theme
const applyThemeCmd = (theme: Theme): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      applyTheme(theme)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

// Keeps the choice for the next visit and switches the page to it
const themeChoiceCmd = (choice: ThemeChoice, theme: Theme): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(() => {
      saveThemeChoice(choice)
      applyTheme(theme)
      return Promise.resolve()
    }),
    (): Msg => ({ _tag: 'NoOp' }),
  )

export const handleCycleTheme = (model: Model): Model => ({
  ...model,
  themeChoice: nextThemeChoice(model.themeChoice),
})

export const handleOsThemeChanged = (model: Model, theme: Theme): Model => ({
  ...model,
  osTheme: theme,
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
// Ignored while a switch is still running, or when it is already so
export const handleScreen2 = (model: Model, open: boolean): Model =>
  model.switching || model.screen2 === open
    ? model
    : { ...model, screen2: open, switching: true }

// The switch has fully finished
export const handleSwitchSettled = (model: Model): Model => ({
  ...model,
  switching: false,
})

// Shows the buttons over the page, with a new timer for their hide
export const handleShowOverlay = (model: Model): Model => ({
  ...model,
  overlay: true,
  overlayTimer: model.overlayTimer + 1,
})

// Hides the buttons over the page, if `timer` is the one of their latest show
export const handleHideOverlay = (model: Model, timer: number): Model =>
  timer === model.overlayTimer ? { ...model, overlay: false } : model

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'CycleTheme': {
      const next = handleCycleTheme(model)
      return [next, themeChoiceCmd(next.themeChoice, themeOf(next))]
    }
    case 'OsThemeChanged': {
      const next = handleOsThemeChanged(model, msg.theme)
      // The page follows the OS only while the choice is auto
      return [
        next,
        next.themeChoice === 'auto' ? applyThemeCmd(themeOf(next)) : Cmd.none(),
      ]
    }
    case 'NoOp':
      return [model, Cmd.none()]
    // A switch of screen shows the buttons over the page, so the button of
    // the new screen is seen as it arrives
    case 'OpenScreen2':
    case 'CloseScreen2': {
      const switched = handleScreen2(model, msg._tag === 'OpenScreen2')
      if (switched === model) return [model, Cmd.none()]
      const next = handleShowOverlay(switched)
      return [next, hideOverlayCmd(next.overlayTimer)]
    }
    case 'SwitchSettled':
      return [handleSwitchSettled(model), Cmd.none()]
    case 'SetRedEyeStyle':
      return [handleSetRedEyeStyle(model, msg.style), redEyeStyleCmd(msg.style)]
    case 'ShowOverlay': {
      const next = handleShowOverlay(model)
      return [next, hideOverlayCmd(next.overlayTimer)]
    }
    case 'HideOverlay':
      return [handleHideOverlay(model, msg.timer), Cmd.none()]
  }
}
