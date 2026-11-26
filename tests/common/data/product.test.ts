import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { productList, shownCategoryList } from '@/common/data/product'

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
