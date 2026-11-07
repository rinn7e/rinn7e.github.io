import { describe, expect, it } from 'vitest'

import { decodeRedEyeStyle } from '../src/red-eye-style'
import {
  handleHideOverlay,
  handleScreen2,
  handleSetRedEyeStyle,
  handleShowOverlay,
  handleSwitchEnded,
  init,
} from '../src/update'

const [model] = init()

describe('screen 2', () => {
  it('starts on the portrait, opens and closes once each switch has ended', () => {
    expect(model.screen._tag).toBe('Screen1')
    const opening = handleScreen2(model, true)
    expect(opening.screen._tag).toBe('Opening')
    const opened = handleSwitchEnded(opening, opening.screenSeq)
    expect(opened.screen._tag).toBe('Screen2')
    const closing = handleScreen2(opened, false)
    expect(closing.screen._tag).toBe('Closing')
    expect(handleSwitchEnded(closing, closing.screenSeq).screen._tag).toBe(
      'Screen1',
    )
  })

  it('ignores open and close while a switch is still running', () => {
    const opening = handleScreen2(model, true)
    expect(handleScreen2(opening, false)).toBe(opening)
    expect(handleScreen2(opening, true)).toBe(opening)
  })

  it('ignores the end of an older switch, and a second end', () => {
    const opening = handleScreen2(model, true)
    expect(handleSwitchEnded(opening, model.screenSeq)).toBe(opening)
    const opened = handleSwitchEnded(opening, opening.screenSeq)
    expect(handleSwitchEnded(opened, opening.screenSeq)).toBe(opened)
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
