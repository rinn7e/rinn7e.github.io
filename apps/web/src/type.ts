import { type RedEyeStyle } from './red-eye-style'
import { type Theme, type ThemeChoice } from './theme'

export interface Model {
  // Auto, light or dark, cycled by the button in the bottom right corner
  themeChoice: ThemeChoice
  // The OS setting, followed while the choice is auto
  osTheme: Theme
  // Screen 2 over the face, opened by a click on an eye or an arrow
  screen2: boolean
  // While the screens are switching: opening or closing screen 2 waits until
  // the switch has fully finished, so a fast tap never turns it halfway
  switching: boolean
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
  | { _tag: 'SwitchSettled' }
  | { _tag: 'SetRedEyeStyle'; style: RedEyeStyle }
  | { _tag: 'ShowOverlay' }
  | { _tag: 'HideOverlay'; timer: number }
