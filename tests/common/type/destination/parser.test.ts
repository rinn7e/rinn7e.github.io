import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'
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

  it('reads the product opened', () => {
    expect(parsePath('/?product=damn-center')).toEqual(
      destinationOfScreen(productsScreen(O.some('damn-center'))),
    )
  })

  it('reads the category of a highlight', () => {
    expect(parsePath('/?category=games')).toEqual(
      destinationOfScreen(productsScreen(O.none, O.some('Game'))),
    )
  })

  it('reads an unknown category as every product', () => {
    expect(parsePath('/?category=nonsense')).toEqual(
      destinationOfScreen(productsScreen()),
    )
  })

  it('reads an unknown product as every product', () => {
    expect(parsePath('/?product=nonsense')).toEqual(
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

  it('round-trips every product and the About page', () => {
    const destinationList = [
      ...productList.map((product) =>
        destinationOfScreen(productsScreen(O.some(product.id))),
      ),
      destinationOfScreen(productsScreen(O.none, O.some('WebApp'))),
      destinationOfScreen(productsScreen(O.none, O.some('BrowserExtension'))),
      destinationOfScreen(productsScreen(O.none, O.some('Game'))),
      destinationOfScreen(productsScreen(O.none, O.some('DeveloperTool'))),
      destinationOfScreen(
        productsScreen(O.some('ninja-adventure-indigo'), O.some('Game')),
      ),
      destinationOfScreen(aboutScreen()),
    ]
    destinationList.forEach((destination) => {
      expect(parsePath(toUrlString(destination))).toEqual(destination)
    })
  })

  it('spells a category with its full name', () => {
    expect(
      toUrlString(
        destinationOfScreen(productsScreen(O.none, O.some('DeveloperTool'))),
      ),
    ).toBe('/?category=developer-tools')
  })

  it('spells the product opened with its id', () => {
    expect(
      toUrlString(destinationOfScreen(productsScreen(O.some('image-overlay')))),
    ).toBe('/?product=image-overlay')
  })
})
