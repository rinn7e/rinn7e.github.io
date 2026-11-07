import { describe, expect, it } from 'vitest'

import { decodeThemeChoice, nextThemeChoice, resolveTheme } from '../src/theme'
import { type Model } from '../src/type'
import {
  handleCycleTheme,
  handleOsThemeChanged,
  init,
  themeOf,
} from '../src/update'

const [model] = init()

describe('theme', () => {
  it('starts on auto, following the OS (light in Node)', () => {
    // The tests run in Node: no localStorage and no matchMedia
    expect(model.themeChoice).toBe('auto')
    expect(themeOf(model)).toBe('light')
  })

  it('cycles auto, light, dark, then auto again', () => {
    const light = handleCycleTheme(model)
    expect(light.themeChoice).toBe('light')
    const dark = handleCycleTheme(light)
    expect(dark.themeChoice).toBe('dark')
    expect(handleCycleTheme(dark).themeChoice).toBe('auto')
    expect(nextThemeChoice('dark')).toBe('auto')
  })

  it('follows the OS only on auto', () => {
    const auto: Model = handleOsThemeChanged(model, 'dark')
    expect(themeOf(auto)).toBe('dark')
    const light: Model = { ...auto, themeChoice: 'light' }
    expect(themeOf(light)).toBe('light')
    expect(resolveTheme('dark', 'light')).toBe('dark')
  })

  it('keeps the rest of the model', () => {
    expect(handleCycleTheme(model).screen).toBe(model.screen)
  })

  it('reads a stored choice, and treats anything else as auto', () => {
    expect(decodeThemeChoice('dark')).toBe('dark')
    expect(decodeThemeChoice('light')).toBe('light')
    expect(decodeThemeChoice('auto')).toBe('auto')
    expect(decodeThemeChoice('blue')).toBe('auto')
    expect(decodeThemeChoice(null)).toBe('auto')
  })
})
