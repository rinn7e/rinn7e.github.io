import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'
import {
  type Model,
  type Msg,
  PropsEq,
  init,
  update,
} from '@/screen/products-screen/product-popup'

const from = { left: 600, top: 300, width: 200 }
const to = { left: 700, top: 700, width: 130 }
const seq = 4

// The popup after `msg`, which must still be open
const step = (msg: Msg, model: Model): Model => {
  const [next] = update(msg, model)
  if (O.isNone(next)) {
    throw new Error(`the popup closed on ${msg._tag}`)
  }
  return next.value
}

const shown = init('damn-center', O.none, seq)[0]

describe('product popup update', () => {
  it('opens at once on its first slide, not playing, when it has no card to fly', () => {
    expect(shown).toEqual({
      id: 'damn-center',
      slideIndex: 0,
      isPlaying: false,
      phase: { _tag: 'Shown' },
      seq,
    })
  })

  it('measures the card, flies it from the grid, spins it, then shows the panel', () => {
    const [measuring] = init('damn-center', O.some(from), seq)
    expect(measuring.phase).toEqual({ _tag: 'Measuring', from })
    const flying = step(
      { _tag: 'CardMeasured', seq, to: O.some(to) },
      measuring,
    )
    expect(flying.phase).toEqual({ _tag: 'Flying', from, to })
    const spinning = step({ _tag: 'CardPlaced', seq }, flying)
    expect(spinning.phase).toEqual({ _tag: 'Spinning' })
    expect(step({ _tag: 'SpinDone', seq }, spinning).phase).toEqual({
      _tag: 'Shown',
    })
  })

  it('shows the panel at once when the card is not found', () => {
    const [measuring] = init('damn-center', O.some(from), seq)
    expect(
      step({ _tag: 'CardMeasured', seq, to: O.none }, measuring).phase,
    ).toEqual({ _tag: 'Shown' })
  })

  it('drops a message of another open, or of a step already past', () => {
    const [measuring] = init('damn-center', O.some(from), seq)
    expect(
      step({ _tag: 'CardMeasured', seq: seq - 1, to: O.some(to) }, measuring),
    ).toEqual(measuring)
    expect(step({ _tag: 'SpinDone', seq }, measuring)).toEqual(measuring)
    expect(step({ _tag: 'CardPlaced', seq }, shown)).toEqual(shown)
  })

  it('flies the card back to its place in the grid, then closes', () => {
    const closing = step({ _tag: 'Close', isAnimated: true }, shown)
    expect(closing.phase).toEqual({ _tag: 'Closing' })
    const returning = step(
      { _tag: 'CloseMeasured', seq, flight: O.some({ from: to, to: from }) },
      closing,
    )
    expect(returning.phase).toEqual({ _tag: 'Returning', from: to, to: from })
    expect(update({ _tag: 'CloseDone', seq }, returning)[0]).toEqual(O.none)
  })

  it('fades the card out when it has no place in the grid, then closes', () => {
    const closing = step({ _tag: 'Close', isAnimated: true }, shown)
    const fading = step({ _tag: 'CloseMeasured', seq, flight: O.none }, closing)
    expect(fading.phase).toEqual({ _tag: 'FadingOut' })
    expect(update({ _tag: 'CloseDone', seq }, fading)[0]).toEqual(O.none)
  })

  it('closes at once with reduced motion', () => {
    expect(update({ _tag: 'Close', isAnimated: false }, shown)[0]).toEqual(
      O.none,
    )
  })

  it('goes on closing when asked to close again', () => {
    const closing = step({ _tag: 'Close', isAnimated: true }, shown)
    expect(step({ _tag: 'Close', isAnimated: true }, closing)).toEqual(closing)
    expect(update({ _tag: 'Close', isAnimated: false }, closing)[0]).toEqual(
      O.some(closing),
    )
  })

  it('drops each step message of another open, even at its own step', () => {
    const other = seq - 1
    const [measuring] = init('damn-center', O.some(from), seq)
    const flying = step(
      { _tag: 'CardMeasured', seq, to: O.some(to) },
      measuring,
    )
    expect(step({ _tag: 'CardPlaced', seq: other }, flying)).toEqual(flying)
    const spinning = step({ _tag: 'CardPlaced', seq }, flying)
    expect(step({ _tag: 'SpinDone', seq: other }, spinning)).toEqual(spinning)
    const closing = step({ _tag: 'Close', isAnimated: true }, shown)
    expect(
      step(
        {
          _tag: 'CloseMeasured',
          seq: other,
          flight: O.some({ from: to, to: from }),
        },
        closing,
      ),
    ).toEqual(closing)
    const returning = step(
      { _tag: 'CloseMeasured', seq, flight: O.some({ from: to, to: from }) },
      closing,
    )
    expect(step({ _tag: 'CloseDone', seq: other }, returning)).toEqual(
      returning,
    )
  })

  it('drops a late measure of the open once the popup is closing', () => {
    const [measuring] = init('damn-center', O.some(from), seq)
    const closing = step({ _tag: 'Close', isAnimated: true }, measuring)
    expect(closing.phase).toEqual({ _tag: 'Closing' })
    expect(
      step({ _tag: 'CardMeasured', seq, to: O.some(to) }, closing),
    ).toEqual(closing)
  })

  it('stays open when an end of a flight back comes before any close', () => {
    expect(update({ _tag: 'CloseDone', seq }, shown)[0]).toEqual(O.some(shown))
  })

  it('moves to the screenshot asked for', () => {
    expect(step({ _tag: 'ShowSlide', index: 2 }, shown).slideIndex).toBe(2)
  })

  it('plays the video only on a click, and stops it on another slide', () => {
    const playing = step({ _tag: 'PlayVideo' }, shown)
    expect(playing.isPlaying).toBe(true)
    expect(step({ _tag: 'ShowSlide', index: 1 }, playing).isPlaying).toBe(false)
  })

  it('keeps playing as the player loads and gets its volume', () => {
    const playing = step({ _tag: 'PlayVideo' }, shown)
    expect(step({ _tag: 'PlayerLoaded' }, playing)).toEqual(playing)
  })

  it('draws again on a change of its model or side, not for a new dispatch', () => {
    const product = productList[0]
    expect(product).toBeDefined()
    if (product !== undefined) {
      const props = {
        model: shown,
        isFlipped: false,
        dispatch: () => undefined,
      }
      expect(
        PropsEq.equals(props, { ...props, dispatch: () => undefined }),
      ).toBe(true)
      expect(
        PropsEq.equals(props, { ...props, model: { ...shown, slideIndex: 1 } }),
      ).toBe(false)
      expect(
        PropsEq.equals(props, {
          ...props,
          model: { ...shown, phase: { _tag: 'Closing' } },
        }),
      ).toBe(false)
      expect(PropsEq.equals(props, { ...props, isFlipped: true })).toBe(false)
    }
  })
})
