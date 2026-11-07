import { describe, expect, it } from 'vitest'

import { decodeRedEyeStyle } from '../src/red-eye-style'
import {
  handleHideOverlay,
  handleScreen2,
  handleSetRedEyeStyle,
  handleShowOverlay,
  init,
} from '../src/update'

const [model] = init()

describe('screen 2', () => {
  it('starts closed, opens and closes', () => {
    expect(model.screen2).toBe(false)
    const opened = handleScreen2(model, true)
    expect(opened.screen2).toBe(true)
    expect(handleScreen2(opened, false).screen2).toBe(false)
  })
})

describe('the buttons over the page', () => {
  it('start hidden, and show on a click until their timer runs out', () => {
    expect(model.overlay).toBe(false)
    const shown = handleShowOverlay(model)
    expect(shown.overlay).toBe(true)
    expect(handleShowOverlay(shown).overlay).toBe(true)
    expect(handleHideOverlay(shown, shown.overlayTimer).overlay).toBe(false)
  })

  it('ignore the hide of an older show', () => {
    const shown = handleShowOverlay(model)
    expect(handleHideOverlay(shown, model.overlayTimer).overlay).toBe(true)
    expect(handleHideOverlay(shown, shown.overlayTimer).overlay).toBe(false)
  })
})

describe('the red eye style', () => {
  it('starts with style 1 and switches', () => {
    expect(model.redEyeStyle).toBe('style1')
    expect(handleSetRedEyeStyle(model, 'style2').redEyeStyle).toBe('style2')
  })

  it('reads a stored style, and treats anything else as no choice', () => {
    expect(decodeRedEyeStyle('style2')).toBe('style2')
    expect(decodeRedEyeStyle('style3')).toBeNull()
    expect(decodeRedEyeStyle(null)).toBeNull()
  })
})
