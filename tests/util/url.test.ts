import * as O from 'fp-ts/Option'
import { Cmd } from 'tea-cup-fp'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  aboutDestination,
  defaultDestination,
  destinationOfScreen,
  productsScreen,
} from '@/common/type/destination'
import { type Msg } from '@/type'
import { update } from '@/update'
import { bootUrlOf, urlWriteOf, urlWriterOf } from '@/util'

import { bootOn } from '../helper/app'
import { browserAt } from '../helper/browser'
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

  it('pushes the URL of a product opened in place, and of its close', () => {
    const model = bootOn('/')
    const openMsg: Msg = {
      _tag: 'ProductsScreenMsg',
      subMsg: { _tag: 'OpenProduct', id: 'damn-center', from: O.none },
    }
    const [openedModel] = update(openMsg, model)
    expect(urlWriteOf(openMsg, model, openedModel)).toEqual(
      O.some({ _tag: 'PushUrl', url: '/?product=damn-center' }),
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
      O.some({ _tag: 'PushUrl', url: '/' }),
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

describe('urlWriterOf', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // The program calls it with the model of `init`, then after every step
  const writerAfterBoot = (path: string) => {
    const write = urlWriterOf()
    const model = bootOn(path)
    write({ tag: 'init', count: 0, mac: [model, Cmd.none()] })
    return { write, model }
  }

  it('pushes a move while the page left is still there, which keeps its scroll', () => {
    const browser = browserAt('/blog', 1500)
    const { write, model } = writerAfterBoot('/blog')
    const msg = navigateTo(aboutDestination())
    write({ tag: 'update', count: 1, msg, mac: update(msg, model) })
    expect(browser.entries).toEqual([
      { url: '/blog', state: { scrollY: 1500 } },
      { url: '/about', state: null },
    ])
  })

  it('writes nothing for the browser back and forward', () => {
    const browser = browserAt('/about', 0)
    const { write, model } = writerAfterBoot('/about')
    const msg: Msg = {
      _tag: 'NavigationMsg',
      subMsg: {
        _tag: 'UrlChanged',
        destination: defaultDestination(),
        scrollY: 0,
      },
    }
    write({ tag: 'update', count: 1, msg, mac: update(msg, model) })
    expect(browser.entries).toEqual([{ url: '/about', state: null }])
  })
})
