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
  subMsg: { _tag: 'Navigate', destination, scrollY: 0 },
})

describe('urlWriteOf', () => {
  it('pushes the URL of a move to another screen, its scroll saved by the link', () => {
    const model = bootOn('/')
    const msg = navigateTo(aboutDestination())
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(
      O.some({ _tag: 'PushUrl', url: '/about', saveScroll: false }),
    )
  })

  it('pushes the URL of a product opened in place, and of its close, keeping the scroll they leave', () => {
    const model = bootOn('/')
    const openMsg: Msg = {
      _tag: 'ProductsScreenMsg',
      subMsg: { _tag: 'OpenProduct', id: 'damn-center', from: O.none },
    }
    const [openedModel] = update(openMsg, model)
    expect(urlWriteOf(openMsg, model, openedModel)).toEqual(
      O.some({
        _tag: 'PushUrl',
        url: '/?product=damn-center',
        saveScroll: true,
      }),
    )
    const closeMsg: Msg = {
      _tag: 'ProductsScreenMsg',
      subMsg: {
        _tag: 'ProductPopupMsg',
        subMsg: { _tag: 'Close', isAnimated: false },
      },
    }
    const [closedModel] = update(closeMsg, openedModel)
    expect(urlWriteOf(closeMsg, openedModel, closedModel)).toEqual(
      O.some({ _tag: 'PushUrl', url: '/', saveScroll: true }),
    )
  })

  it('writes nothing for a screenshot shown', () => {
    const model = bootOn('/?product=damn-center')
    const msg: Msg = {
      _tag: 'ProductsScreenMsg',
      subMsg: {
        _tag: 'ProductPopupMsg',
        subMsg: { _tag: 'ShowSlide', index: 1 },
      },
    }
    const [updatedModel] = update(msg, model)
    expect(urlWriteOf(msg, model, updatedModel)).toEqual(O.none)
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
      subMsg: {
        _tag: 'UrlChanged',
        destination: defaultDestination(),
        scrollY: 0,
      },
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
        locationOf('https://rinn7e.com/?product=nonsense'),
        destinationOfScreen(productsScreen()),
      ),
    ).toEqual(O.some('/'))
  })
})
