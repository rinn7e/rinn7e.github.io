import { describe, expect, it } from 'vitest'

import {
  type Destination,
  aboutDestination,
  blogDestination,
  defaultDestination,
} from '@/common/type/destination'
import { type Model, type Msg } from '@/type'
import { update } from '@/update'

import { bootOn } from './helper/app'

// Ported from TEA Ecosystem (`tests/scroll.test.ts`): where each move draws
// its screen (`Model.scroll`), scrolled to before the browser paints it

const step = (model: Model, msg: Msg): Model => update(msg, model)[0]

// A link click to `destination`
const click = (model: Model, destination: Destination) =>
  step(model, {
    _tag: 'NavigationMsg',
    subMsg: { _tag: 'Navigate', destination },
  })

// The browser's back or forward landing on `destination`, whose entry saved
// `scrollY`
const landing = (destination: Destination, scrollY: number): Msg => ({
  _tag: 'NavigationMsg',
  subMsg: { _tag: 'UrlChanged', destination, scrollY },
})

describe('where a move draws its screen', () => {
  it('boots at the scroll saved in its entry, or at the top', () => {
    expect(bootOn('/blog').scroll).toEqual({ seq: 0, top: 0 })
  })

  it('draws a page opened by a link at the top', () => {
    const onAbout = click(bootOn('/blog'), aboutDestination())
    expect(onAbout.scroll).toEqual({ seq: 1, top: 0 })
  })

  it('draws the entry the browser lands on at its saved scroll', () => {
    const onAbout = click(bootOn('/blog'), aboutDestination())
    const back = step(onAbout, landing(blogDestination(), 1500))
    expect(back.screenModel._tag).toBe('BlogScreenModel')
    expect(back.scroll).toEqual({ seq: 2, top: 1500 })
  })

  it('changes nothing when the browser lands on the destination shown', () => {
    const onBlog = click(bootOn('/'), blogDestination())
    expect(step(onBlog, landing(blogDestination(), 300))).toBe(onBlog)
  })

  it('draws the home page the browser comes back to at its saved scroll', () => {
    const onBlog = click(bootOn('/'), blogDestination())
    const back = step(onBlog, landing(defaultDestination(), 900))
    expect(back.scroll.top).toBe(900)
  })
})
