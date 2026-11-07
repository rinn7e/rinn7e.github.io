import * as E from 'fp-ts/Either'
import * as t from 'io-ts'

import { decodeWith } from '@portfolio/codec'

// Light or dark. The page starts from the visitor's last choice, else from
// the OS setting; the choice is kept in localStorage.
export const ThemeCodec = t.keyof({ light: null, dark: null })

export type Theme = t.TypeOf<typeof ThemeCodec>

const STORAGE_KEY = 'portfolio:theme'

export const otherTheme = (theme: Theme): Theme =>
  theme === 'dark' ? 'light' : 'dark'

// A stored value that is missing or not a theme counts as no choice
export const decodeTheme = (raw: unknown): Theme | null => {
  const result = decodeWith(ThemeCodec)(raw)
  return E.isRight(result) ? result.right : null
}

export const loadTheme = (): Theme | null => {
  try {
    return decodeTheme(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Not kept; the theme still applies for this visit
  }
}

export const osTheme = (): Theme =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export const initialTheme = (): Theme => loadTheme() ?? osTheme()

// Dark mode is the .dark class on <html>: the Tailwind dark: variant and the
// design tokens read it
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}
