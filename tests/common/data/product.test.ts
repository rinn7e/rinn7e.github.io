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
