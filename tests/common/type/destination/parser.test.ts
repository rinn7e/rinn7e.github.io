import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { productList, shownCategoryList } from '@/common/data/product'
import {
  type Destination,
  aboutScreen,
  destinationOfScreen,
  notFoundScreen,
  parseDestination,
  privacyScreen,
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
    expect(parsePath('/?category=browser-extensions')).toEqual(
      destinationOfScreen(productsScreen(O.none, O.some('BrowserExtension'))),
    )
  })

  it('reads a category with no visible product as every product', () => {
    expect(parsePath('/?category=games')).toEqual(
      destinationOfScreen(productsScreen()),
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

  it('reads a hidden product as every product', () => {
    expect(parsePath('/?product=image-overlay')).toEqual(
      destinationOfScreen(productsScreen()),
    )
  })

  it('reads the About page with or without a trailing slash', () => {
    expect(parsePath('/about')).toEqual(destinationOfScreen(aboutScreen()))
    expect(parsePath('/about/')).toEqual(destinationOfScreen(aboutScreen()))
  })

  it('reads the Privacy page with or without a trailing slash', () => {
    expect(parsePath('/privacy')).toEqual(destinationOfScreen(privacyScreen()))
    expect(parsePath('/privacy/')).toEqual(destinationOfScreen(privacyScreen()))
  })

  it('reads any other path as not found', () => {
    expect(parsePath('/resume')).toEqual(destinationOfScreen(notFoundScreen()))
  })
})

describe('toUrlString', () => {
  it('spells every product as the root', () => {
    expect(toUrlString(destinationOfScreen(productsScreen()))).toBe('/')
  })

  it('round-trips every product and the About and Privacy pages', () => {
    const destinationList = [
      ...productList.map((product) =>
        destinationOfScreen(productsScreen(O.some(product.id))),
      ),
      ...shownCategoryList.map((category) =>
        destinationOfScreen(productsScreen(O.none, O.some(category))),
      ),
      destinationOfScreen(
        productsScreen(O.some('damn-center'), O.some('BrowserExtension')),
      ),
      destinationOfScreen(aboutScreen()),
      destinationOfScreen(privacyScreen()),
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
