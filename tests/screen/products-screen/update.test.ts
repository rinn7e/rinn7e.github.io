import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { type Model, init, update } from '@/screen/products-screen'

const idsOpen = (model: Model) => model.openedList.map((opened) => opened.id)

const phasesOf = (model: Model) =>
  model.openedList.map((opened) => opened.phase._tag)

const openAt = (id: string, model: Model) =>
  update({ _tag: 'OpenProduct', id, from: O.none }, model)[0]

describe('products screen update', () => {
  it('starts with the product of its destination open on its first screenshot', () => {
    expect(init(O.some('damn-center'))[0].openedList).toEqual([
      { id: 'damn-center', slideIndex: 0, phase: { _tag: 'Shown' }, seq: 0 },
    ])
  })

  it('starts on the category of its destination', () => {
    expect(init(O.none, O.some('Game'))[0].category).toEqual(O.some('Game'))
    expect(init(O.none)[0].category).toEqual(O.none)
  })

  it('opens a product, moves through its screenshots and closes it', () => {
    const opened = openAt('ninja-adventure-indigo', init(O.none)[0])
    const [slide] = update(
      { _tag: 'ShowSlide', id: 'ninja-adventure-indigo', index: 3 },
      opened,
    )
    expect(slide.openedList[0]?.slideIndex).toBe(3)
    const [closed] = update(
      { _tag: 'CloseProduct', id: 'ninja-adventure-indigo', isAnimated: false },
      slide,
    )
    expect(closed.openedList).toEqual([])
    expect(closed.returnedList).toEqual(['ninja-adventure-indigo'])
  })

  it('keeps the screenshot shown when the product open is opened again', () => {
    const [model] = init(O.some('damn-center'))
    const [slide] = update(
      { _tag: 'ShowSlide', id: 'damn-center', index: 2 },
      model,
    )
    expect(openAt('damn-center', slide)).toEqual(slide)
  })

  it('opens another product on its first screenshot and closes the first', () => {
    const [model] = init(O.some('damn-center'))
    const other = openAt('image-overlay', model)
    expect(idsOpen(other)).toEqual(['image-overlay'])
    expect(other.openedList[0]?.slideIndex).toBe(0)
    expect(other.returnedList).toEqual(['damn-center'])
  })

  describe('the animation of an open', () => {
    const from = { left: 600, top: 300, width: 200 }
    const to = { left: 700, top: 700, width: 130 }

    it('measures the card, flies it from the column, spins it, then shows the panel', () => {
      const [measuring] = update(
        { _tag: 'OpenProduct', id: 'damn-center', from: O.some(from) },
        init(O.none)[0],
      )
      expect(measuring.openedList[0]?.phase).toEqual({
        _tag: 'Measuring',
        from,
      })
      const { seq } = measuring
      const [flying] = update(
        { _tag: 'CardMeasured', seq, to: O.some(to) },
        measuring,
      )
      expect(flying.openedList[0]?.phase).toEqual({
        _tag: 'Flying',
        from,
        to,
      })
      const [spinning] = update({ _tag: 'CardPlaced', seq }, flying)
      expect(phasesOf(spinning)).toEqual(['Spinning'])
      const [shown] = update({ _tag: 'SpinDone', seq }, spinning)
      expect(phasesOf(shown)).toEqual(['Shown'])
    })

    it('shows the panel at once when the card is not found', () => {
      const [measuring] = update(
        { _tag: 'OpenProduct', id: 'damn-center', from: O.some(from) },
        init(O.none)[0],
      )
      const [shown] = update(
        { _tag: 'CardMeasured', seq: measuring.seq, to: O.none },
        measuring,
      )
      expect(phasesOf(shown)).toEqual(['Shown'])
    })

    it('drops a late message of an earlier open', () => {
      const [first] = update(
        { _tag: 'OpenProduct', id: 'damn-center', from: O.some(from) },
        init(O.none)[0],
      )
      const [second] = update(
        { _tag: 'OpenProduct', id: 'image-overlay', from: O.some(from) },
        first,
      )
      const [afterLate] = update(
        { _tag: 'CardMeasured', seq: first.seq, to: O.some(to) },
        second,
      )
      expect(afterLate).toEqual(second)
    })

    it('flies the card back to its place in the grid, then closes', () => {
      const [model] = init(O.some('damn-center'))
      const [closing] = update(
        { _tag: 'CloseProduct', id: 'damn-center', isAnimated: true },
        model,
      )
      expect(phasesOf(closing)).toEqual(['Closing'])
      const [returning] = update(
        {
          _tag: 'CloseMeasured',
          seq: closing.seq,
          flight: O.some({ from: to, to: from }),
        },
        closing,
      )
      expect(returning.openedList[0]?.phase).toEqual({
        _tag: 'Returning',
        from: to,
        to: from,
      })
      const [closed] = update(
        { _tag: 'CloseDone', seq: returning.seq },
        returning,
      )
      expect(closed.openedList).toEqual([])
      expect(closed.returnedList).toEqual(['damn-center'])
    })

    it('fades the card out when it has no place in the grid', () => {
      const [model] = init(O.some('damn-center'))
      const [closing] = update(
        { _tag: 'CloseProduct', id: 'damn-center', isAnimated: true },
        model,
      )
      const [fading] = update(
        { _tag: 'CloseMeasured', seq: closing.seq, flight: O.none },
        closing,
      )
      expect(phasesOf(fading)).toEqual(['FadingOut'])
    })
  })

  describe('flip all and unflip all, from the debug panel', () => {
    it('turns every card over to its back, then back again', () => {
      const [model] = init(O.none)
      expect(model.isFlipped).toBe(false)
      const [flipped] = update({ _tag: 'FlipAll' }, model)
      expect(flipped.isFlipped).toBe(true)
      const [unflipped] = update({ _tag: 'UnflipAll' }, flipped)
      expect(unflipped.isFlipped).toBe(false)
    })

    it('keeps the cards flipped when a product opens and closes', () => {
      const [flipped] = update({ _tag: 'FlipAll' }, init(O.none)[0])
      const opened = openAt('damn-center', flipped)
      expect(opened.isFlipped).toBe(true)
      const [closed] = update(
        { _tag: 'CloseProduct', id: 'damn-center', isAnimated: false },
        opened,
      )
      expect(closed.isFlipped).toBe(true)
    })
  })
})
