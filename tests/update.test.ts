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
      subMsg: { _tag: 'Navigate', destination },
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
