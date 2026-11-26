import { describe, expect, it } from 'vitest'

import { aboutDestination, defaultDestination } from '@/common/type/destination'
import { type Model, type Msg } from '@/type'
import { update } from '@/update'

import { bootOn } from './helper/app'

const navigateTo =
  (destination = defaultDestination()) =>
  (model: Model): Model => {
    const msg: Msg = {
      _tag: 'NavigationMsg',
      subMsg: { _tag: 'Navigate', destination, scrollY: 0 },
    }
    return update(msg, model)[0]
  }

const isFirstShowOf = (model: Model): boolean | null =>
  model.screenModel._tag === 'ProductsScreenModel'
    ? model.screenModel.model.isFirstShow
    : null

describe('the entrance of the cards', () => {
  it('fades the cards in when the products are the first screen seen', () => {
    expect(isFirstShowOf(bootOn('/'))).toBe(true)
  })

  it('shows the cards at once after a switch of tab', () => {
    const backFromAbout = navigateTo(defaultDestination())(
      navigateTo(aboutDestination())(bootOn('/')),
    )
    expect(isFirstShowOf(backFromAbout)).toBe(false)
  })
})

describe('the Flip button of the header', () => {
  const toggle = (model: Model): Model =>
    update(
      { _tag: 'ProfileHeaderMsg', subMsg: { _tag: 'ToggleFlipAll' } },
      model,
    )[0]

  const isFlippedOf = (model: Model): boolean | null =>
    model.screenModel._tag === 'ProductsScreenModel'
      ? model.screenModel.model.isFlipped
      : null

  it('turns the cards to the side they are not on', () => {
    const flipped = toggle(bootOn('/'))
    expect(isFlippedOf(flipped)).toBe(true)
    expect(isFlippedOf(toggle(flipped))).toBe(false)
  })

  it('does nothing off the products screen', () => {
    const about = bootOn('/about')
    expect(toggle(about)).toEqual(about)
  })
})

describe('the blog', () => {
  it('opens a post on its address', () => {
    const { screenModel } = bootOn('/blog/format-date-with-purescript')
    expect(
      screenModel._tag === 'BlogPostScreenModel'
        ? screenModel.model.post.title
        : null,
    ).toBe('Format Date with Purescript')
  })

  it('shows a slug with no post as not found', () => {
    expect(bootOn('/blog/nonsense').screenModel._tag).toBe(
      'NotFoundScreenModel',
    )
  })
})

describe('the screens with no state yet', () => {
  it('keep their model on their own message, and drop the message of another screen', () => {
    const about = bootOn('/about')
    expect(
      update({ _tag: 'AboutScreenMsg', subMsg: { _tag: 'NoOp' } }, about)[0],
    ).toEqual(about)
    expect(
      update({ _tag: 'PrivacyScreenMsg', subMsg: { _tag: 'NoOp' } }, about)[0],
    ).toEqual(about)
  })
})
