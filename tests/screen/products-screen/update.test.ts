import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { type Model, init, update } from '@/screen/products-screen'
import { type Msg as PopupMsg } from '@/screen/products-screen/product-popup'

const openedOf = (model: Model) => O.toUndefined(model.popup)

const openAt = (id: string, model: Model) =>
  update({ _tag: 'OpenProduct', id, from: O.none }, model)[0]

const toPopup = (subMsg: PopupMsg, model: Model) =>
  update({ _tag: 'ProductPopupMsg', subMsg }, model)[0]

describe('products screen update', () => {
  it('starts with the product of its destination open on its first screenshot', () => {
    expect(openedOf(init(O.some('damn-center'))[0])).toEqual({
      id: 'damn-center',
      slideIndex: 0,
      phase: { _tag: 'Shown' },
      seq: 0,
    })
  })

  it('starts on the category of its destination', () => {
    expect(init(O.none, O.some('Game'))[0].category).toEqual(O.some('Game'))
    expect(init(O.none)[0].category).toEqual(O.none)
  })

  it('opens a product, moves through its screenshots and closes it', () => {
    const opened = openAt('ninja-adventure-indigo', init(O.none)[0])
    const slide = toPopup({ _tag: 'ShowSlide', index: 3 }, opened)
    expect(openedOf(slide)?.slideIndex).toBe(3)
    const closed = toPopup({ _tag: 'Close', isAnimated: false }, slide)
    expect(closed.popup).toEqual(O.none)
  })

  it('keeps the screenshot shown when the product open is opened again', () => {
    const [model] = init(O.some('damn-center'))
    const slide = toPopup({ _tag: 'ShowSlide', index: 2 }, model)
    expect(openAt('damn-center', slide)).toEqual(slide)
  })

  it('opens another product on its first screenshot and puts the first back', () => {
    const [model] = init(O.some('damn-center'))
    const other = openAt('image-overlay', model)
    expect(openedOf(other)?.id).toBe('image-overlay')
    expect(openedOf(other)?.slideIndex).toBe(0)
  })

  it('gives each open its own seq, so a late message of an earlier one is dropped', () => {
    const from = { left: 600, top: 300, width: 200 }
    const to = { left: 700, top: 700, width: 130 }
    const [first] = update(
      { _tag: 'OpenProduct', id: 'damn-center', from: O.some(from) },
      init(O.none)[0],
    )
    const [second] = update(
      { _tag: 'OpenProduct', id: 'image-overlay', from: O.some(from) },
      first,
    )
    expect(openedOf(second)?.seq).toBe((openedOf(first)?.seq ?? 0) + 1)
    const afterLate = toPopup(
      { _tag: 'CardMeasured', seq: openedOf(first)?.seq ?? -1, to: O.some(to) },
      second,
    )
    expect(afterLate).toEqual(second)
  })

  it('lets the deal finish on an open, and ends the first show when a card comes back', () => {
    const [firstShow] = init(O.none, O.none, true)
    const opened = openAt('damn-center', firstShow)
    expect(opened.isFirstShow).toBe(true)
    const closed = toPopup({ _tag: 'Close', isAnimated: false }, opened)
    expect(closed.isFirstShow).toBe(false)
    const replaced = openAt('image-overlay', opened)
    expect(replaced.isFirstShow).toBe(false)
  })

  it('keeps the next popup open when the flight back of the one before ends late', () => {
    const from = { left: 600, top: 300, width: 200 }
    const to = { left: 700, top: 700, width: 130 }
    const flight = O.some({ from: to, to: from })
    const openA = openAt('damn-center', init(O.none)[0])
    const seqA = openedOf(openA)?.seq ?? -1
    const closingA = toPopup({ _tag: 'Close', isAnimated: true }, openA)
    const returningA = toPopup(
      { _tag: 'CloseMeasured', seq: seqA, flight },
      closingA,
    )
    const openB = openAt('image-overlay', returningA)
    const seqB = openedOf(openB)?.seq ?? -1
    const closingB = toPopup({ _tag: 'Close', isAnimated: true }, openB)
    const returningB = toPopup(
      { _tag: 'CloseMeasured', seq: seqB, flight },
      closingB,
    )
    const afterLateA = toPopup({ _tag: 'CloseDone', seq: seqA }, returningB)
    expect(openedOf(afterLateA)?.id).toBe('image-overlay')
    expect(openedOf(afterLateA)?.phase._tag).toBe('Returning')
  })

  it('drops a message of the popup when none is open', () => {
    const [model] = init(O.none)
    expect(toPopup({ _tag: 'ShowSlide', index: 1 }, model)).toEqual(model)
  })

  describe('flip all and unflip all', () => {
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
      const closed = toPopup({ _tag: 'Close', isAnimated: false }, opened)
      expect(closed.isFlipped).toBe(true)
    })
  })
})
