import { describe, expect, it } from 'vitest'

import { decodeTheme, otherTheme } from '../src/theme'
import { type Model } from '../src/type'
import { handleToggleTheme, init } from '../src/update'

const [model] = init()
const light: Model = { ...model, theme: 'light' }

describe('theme', () => {
  it('toggles between light and dark', () => {
    const dark = handleToggleTheme(light)
    expect(dark.theme).toBe('dark')
    expect(handleToggleTheme(dark).theme).toBe('light')
  })

  it('keeps the rest of the model', () => {
    expect(handleToggleTheme(light).screen2).toBe(light.screen2)
  })

  it('flips with otherTheme', () => {
    expect(otherTheme('light')).toBe('dark')
    expect(otherTheme('dark')).toBe('light')
  })

  it('reads a stored choice, and treats anything else as no choice', () => {
    expect(decodeTheme('dark')).toBe('dark')
    expect(decodeTheme('light')).toBe('light')
    expect(decodeTheme('blue')).toBeNull()
    expect(decodeTheme(null)).toBeNull()
  })

  it('starts light when there is no stored choice and no OS setting', () => {
    // The tests run in Node: no localStorage and no matchMedia
    expect(model.theme).toBe('light')
  })
})
