import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import {
  type Destination,
  aboutScreen,
  destinationOfScreen,
  notFoundScreen,
  parseDestination,
  productsScreen,
  toUrlString,
} from '@/common/type/destination'

const parsePath = (path: string): Destination =>
  parseDestination(`https://rinn7e.com${path}`)

describe('parseDestination', () => {
  it('reads the root as every product', () => {
    expect(parsePath('/')).toEqual(destinationOfScreen(productsScreen()))
  })

  it('reads a category of the products', () => {
    expect(parsePath('/?category=games')).toEqual(
      destinationOfScreen(productsScreen(O.some('Game'))),
    )
  })

  it('reads an unknown category as every product', () => {
    expect(parsePath('/?category=nonsense')).toEqual(
      destinationOfScreen(productsScreen()),
    )
  })

  it('reads the About page with or without a trailing slash', () => {
    expect(parsePath('/about')).toEqual(destinationOfScreen(aboutScreen()))
    expect(parsePath('/about/')).toEqual(destinationOfScreen(aboutScreen()))
  })

  it('reads any other path as not found', () => {
    expect(parsePath('/resume')).toEqual(destinationOfScreen(notFoundScreen()))
  })
})

describe('toUrlString', () => {
  it('spells every product as the root', () => {
    expect(toUrlString(destinationOfScreen(productsScreen()))).toBe('/')
  })

  it('round-trips every category and the About page', () => {
    const destinationList = [
      destinationOfScreen(productsScreen(O.some('WebApp'))),
      destinationOfScreen(productsScreen(O.some('BrowserExtension'))),
      destinationOfScreen(productsScreen(O.some('Game'))),
      destinationOfScreen(productsScreen(O.some('DeveloperTool'))),
      destinationOfScreen(aboutScreen()),
    ]
    destinationList.forEach((destination) => {
      expect(parsePath(toUrlString(destination))).toEqual(destination)
    })
  })

  it('spells a category with its full name', () => {
    expect(
      toUrlString(destinationOfScreen(productsScreen(O.some('DeveloperTool')))),
    ).toBe('/?category=developer-tools')
  })
})
