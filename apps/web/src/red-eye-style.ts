import * as E from 'fp-ts/Either'
import * as t from 'io-ts'

import { decodeWith } from '@portfolio/codec'

// The look of the red eye: style1, the three tomoe, or style2, the
// pinwheel (drawn by the design tools). Picked with
// the switch by the red eye button and kept in localStorage.
export const RedEyeStyleCodec = t.keyof({ style1: null, style2: null })

export type RedEyeStyle = t.TypeOf<typeof RedEyeStyleCodec>

export const RED_EYE_STYLES: readonly RedEyeStyle[] = ['style1', 'style2']

const STORAGE_KEY = 'portfolio:red-eye-style'

// A stored value that is missing or not a style counts as no choice
export const decodeRedEyeStyle = (raw: unknown): RedEyeStyle | null => {
  const result = decodeWith(RedEyeStyleCodec)(raw)
  return E.isRight(result) ? result.right : null
}

export const loadRedEyeStyle = (): RedEyeStyle | null => {
  try {
    return decodeRedEyeStyle(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export const saveRedEyeStyle = (style: RedEyeStyle): void => {
  try {
    localStorage.setItem(STORAGE_KEY, style)
  } catch {
    // Not kept; the style still applies for this visit
  }
}

export const initialRedEyeStyle = (): RedEyeStyle =>
  loadRedEyeStyle() ?? 'style1'
