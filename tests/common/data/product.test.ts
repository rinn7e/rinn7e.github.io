import * as O from 'fp-ts/Option'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  productList,
  quickLinkOf,
  shownCategoryList,
} from '@/common/data/product'

describe('product list', () => {
  it('keeps only the visible products, with a logo first, each group newest first', () => {
    expect(productList.map((product) => product.id)).toEqual([
      'tea-ecosystem',
      'claude-desktop-theme-tuner',
      'damn-center',
    ])
  })

  it('shows only the categories with a visible product', () => {
    expect(shownCategoryList).toEqual([
      'WebApp',
      'BrowserExtension',
      'DeveloperTool',
    ])
  })
})

describe('the videos of the products', () => {
  const videoSlideList = productList.flatMap((product) =>
    product.slideList.flatMap((slide) =>
      slide._tag === 'VideoSlide' ? [{ product, slide }] : [],
    ),
  )

  it('come first in their slideshow, on a poster of the site that exists', () => {
    expect(videoSlideList.length).toBeGreaterThan(0)
    videoSlideList.forEach(({ product, slide }) => {
      expect(product.slideList[0]).toBe(slide)
      expect(existsSync(join('public', slide.poster))).toBe(true)
    })
  })

  it('name a YouTube video by its id', () => {
    videoSlideList.forEach(({ slide }) => {
      expect(slide.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/)
      expect(slide.title).not.toBe('')
    })
  })
})

describe('the quick link of a card', () => {
  const quickLinkOfId = (id: string) => {
    const product = productList.find((p) => p.id === id)
    return product === undefined ? O.none : quickLinkOf(product)
  }

  it('goes to the live app first', () => {
    expect(quickLinkOfId('claude-desktop-theme-tuner')).toEqual(
      O.some({
        label: 'Open the app',
        url: 'https://rinn7e.com/claude-desktop-theme-tuner/',
        firefoxUrl: O.none,
      }),
    )
  })

  it('goes to the store of the browser for an extension in both stores', () => {
    expect(quickLinkOfId('damn-center')).toEqual(
      O.some({
        label: 'Add to browser',
        url: 'https://chromewebstore.google.com/detail/damn-center/jljnmcioeicnlafnjmgknjgegnaccaii',
        firefoxUrl: O.some(
          'https://addons.mozilla.org/en-US/firefox/addon/damn-center/',
        ),
      }),
    )
  })

  it('exists for every card shown', () => {
    productList.forEach((product) => {
      expect(O.isSome(quickLinkOf(product))).toBe(true)
    })
  })
})
