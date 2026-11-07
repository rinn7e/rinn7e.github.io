import { Cmd, Task } from 'tea-cup-fp'

import { TRANSITION_MS, prefersReducedMotion } from './portrait/screen-fade'
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
import { type Model, type Msg, type ScreenState } from './type'

// How long the buttons over the page stay after they show, in milliseconds
export const OVERLAY_MS = 3000

// Sends `msg` after `ms` milliseconds
const delayCmd = (ms: number, msg: Msg): Cmd<Msg> =>
  Task.attempt(
    Task.fromPromise(
      () => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    ),
    (): Msg => msg,
  )

// Ends switch `seq` once its time is over, in case no transitionend comes
// (a part that did not move, a tab in the background), as in tea-cup-drawer.
// With reduced motion the switch jumps, so it ends at once.
const switchTimeoutCmd = (seq: number): Cmd<Msg> =>
  delayCmd(prefersReducedMotion() ? 0 : TRANSITION_MS + 50, {
    _tag: 'SwitchEnded',
    seq,
  })

// Hides the buttons over the page OVERLAY_MS from now, unless they show again
// before (a newer `timer`)
const hideOverlayCmd = (timer: number): Cmd<Msg> =>
  delayCmd(OVERLAY_MS, { _tag: 'HideOverlay', timer })

export const init = (): [Model, Cmd<Msg>] => [
  {
    themeChoice: loadThemeChoice(),
    osTheme: osTheme(),
    screen: { _tag: 'Screen1' },
    screenSeq: 0,
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
// Screen 2 shows, or is on its way (the view keeps it open meanwhile)
export const screen2Open = (screen: ScreenState): boolean =>
  screen._tag === 'Opening' || screen._tag === 'Screen2'

// Starts opening (from the portrait) or closing (from screen 2); anything
// else waits, so a switch always finishes before the next one
export const handleScreen2 = (model: Model, open: boolean): Model => {
  const from = open ? 'Screen1' : 'Screen2'
  if (model.screen._tag !== from) return model
  return {
    ...model,
    screen: { _tag: open ? 'Opening' : 'Closing' },
    screenSeq: model.screenSeq + 1,
  }
}

// Switch `seq` has ended: it settles on the screen it was going to. An end
// from an older switch, or a second end of this one, changes nothing.
export const handleSwitchEnded = (model: Model, seq: number): Model => {
  if (seq !== model.screenSeq) return model
  switch (model.screen._tag) {
    case 'Opening':
      return { ...model, screen: { _tag: 'Screen2' } }
    case 'Closing':
      return { ...model, screen: { _tag: 'Screen1' } }
    default:
      return model
  }
}

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
      return [
        next,
        Cmd.batch([
          hideOverlayCmd(next.overlayTimer),
          switchTimeoutCmd(next.screenSeq),
        ]),
      ]
    }
    case 'SwitchEnded':
      return [handleSwitchEnded(model, msg.seq), Cmd.none()]
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
