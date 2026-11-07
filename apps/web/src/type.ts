import { type RedEyeStyle } from './red-eye-style'
import { type Theme } from './theme'

export interface Model {
  // Light or dark, switched by the button right of the bottom centre
  theme: Theme
  // Screen 2 over the face, opened by a click on an eye or an arrow
  screen2: boolean
  // The look of the red eye, picked with the switch by its button
  redEyeStyle: RedEyeStyle
}

export type Msg =
  | { _tag: 'ToggleTheme' }
  | { _tag: 'NoOp' }
  | { _tag: 'OpenScreen2' }
  | { _tag: 'CloseScreen2' }
  | { _tag: 'SetRedEyeStyle'; style: RedEyeStyle }
