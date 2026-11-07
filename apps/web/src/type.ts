import { type RedEyeStyle } from './red-eye-style'
import { type Theme, type ThemeChoice } from './theme'

// Where the screens are, as in tea-cup-drawer: at rest on the portrait or
// on screen 2, or switching between them. The motion of a switch is CSS
// transitions (portrait/screen-fade.ts); the model only knows its phase, and
// takes no open or close until the switch has settled.
export type ScreenState =
  | { _tag: 'Screen1' }
  | { _tag: 'Opening' }
  | { _tag: 'Screen2' }
  | { _tag: 'Closing' }

export interface Model {
  // Auto, light or dark, cycled by the button in the bottom right corner
  themeChoice: ThemeChoice
  // The OS setting, followed while the choice is auto
  osTheme: Theme
  // The face or screen 2 over it, opened by a click on an eye or the arrow
  screen: ScreenState
  // Counts the switches, so the end of an older one is ignored
  screenSeq: number
  // The look of the red eye, picked with the switch by its button
  redEyeStyle: RedEyeStyle
  // Whether the buttons over the page show (GitHub, theme, the arrow and
  // the close button): hidden at first, and shown for a few seconds after
  // each click, tap, Tab or switch of screen
  overlay: boolean
  // Counts the times they were shown, so only the hide of the latest shows
  // hides them
  overlayTimer: number
}

export type Msg =
  | { _tag: 'CycleTheme' }
  | { _tag: 'OsThemeChanged'; theme: Theme }
  | { _tag: 'NoOp' }
  | { _tag: 'OpenScreen2' }
  | { _tag: 'CloseScreen2' }
  | { _tag: 'SwitchEnded'; seq: number }
  | { _tag: 'SetRedEyeStyle'; style: RedEyeStyle }
  | { _tag: 'ShowOverlay' }
  | { _tag: 'HideOverlay'; timer: number }
