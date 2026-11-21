import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import {
  aboutDestination,
  defaultDestination,
  destinationOfScreen,
  productsScreen,
} from '@/common/type/destination'
import { type Msg } from '@/type'
import { update } from '@/update'
import { bootUrlOf, urlWriteOf } from '@/util'

import { bootOn } from '../helper/app'
import { locationOf } from '../helper/location'

const navigateTo = (destination = aboutDestination()): Msg => ({
  _tag: 'NavigationMsg',
  subMsg: { _tag: 'Navigate', destination },
})

describe('urlWriteOf', () => {
  it('pushes the URL of a move to another screen', () => {
    const model = bootOn('/')
    const msg = navigateTo(aboutDestination())
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(
      O.some({ _tag: 'PushUrl', url: '/about' }),
    )
  })

  it('pushes the URL of a category picked in place', () => {
    const model = bootOn('/')
    const msg: Msg = {
      _tag: 'ProductsScreenMsg',
      subMsg: { _tag: 'SelectCategory', category: O.some('Game') },
    }
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(
      O.some({ _tag: 'PushUrl', url: '/?category=games' }),
    )
  })

  it('writes nothing for a move to the destination shown', () => {
    const model = bootOn('/about')
    const msg = navigateTo(aboutDestination())
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(O.none)
  })

  it('writes nothing for the browser back and forward', () => {
    const model = bootOn('/about')
    const msg: Msg = {
      _tag: 'NavigationMsg',
      subMsg: { _tag: 'UrlChanged', destination: defaultDestination() },
    }
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(O.none)
  })
})

describe('bootUrlOf', () => {
  it('keeps a URL already in its own spelling', () => {
    expect(
      bootUrlOf(locationOf('https://rinn7e.com/about'), aboutDestination()),
    ).toEqual(O.none)
  })

  it('corrects another spelling of the destination', () => {
    expect(
      bootUrlOf(locationOf('https://rinn7e.com/about/'), aboutDestination()),
    ).toEqual(O.some('/about'))
    expect(
      bootUrlOf(
        locationOf('https://rinn7e.com/?category=nonsense'),
        destinationOfScreen(productsScreen()),
      ),
    ).toEqual(O.some('/'))
  })
})
