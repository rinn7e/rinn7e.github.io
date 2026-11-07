import * as E from 'fp-ts/Either'
import * as t from 'io-ts'

import { decodeWith } from '@portfolio/codec'

// The look of the page: light or dark
export type Theme = 'light' | 'dark'

// What the visitor picked: auto (the default) follows the OS setting, light
// and dark keep to one. The choice is kept in localStorage; a light or dark
// kept before auto existed still reads as that choice.
export const ThemeChoiceCodec = t.keyof({ auto: null, light: null, dark: null })

export type ThemeChoice = t.TypeOf<typeof ThemeChoiceCodec>

const STORAGE_KEY = 'portfolio:theme'

// The order of the theme button: auto, light, dark, then auto again
export const nextThemeChoice = (choice: ThemeChoice): ThemeChoice =>
  choice === 'auto' ? 'light' : choice === 'light' ? 'dark' : 'auto'

// The theme a choice shows, with the OS setting `os` for auto
export const resolveTheme = (choice: ThemeChoice, os: Theme): Theme =>
  choice === 'auto' ? os : choice

// A stored value that is missing or not a choice counts as auto
export const decodeThemeChoice = (raw: unknown): ThemeChoice => {
  const result = decodeWith(ThemeChoiceCodec)(raw)
  return E.isRight(result) ? result.right : 'auto'
}

export const loadThemeChoice = (): ThemeChoice => {
  try {
    return decodeThemeChoice(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'auto'
  }
}

export const saveThemeChoice = (choice: ThemeChoice): void => {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Not kept; the choice still applies for this visit
  }
}

export const osTheme = (): Theme =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

// The theme the page starts with
export const initialTheme = (): Theme =>
  resolveTheme(loadThemeChoice(), osTheme())

// Dark mode is the .dark class on <html>: the Tailwind dark: variant and the
// design tokens read it
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}
