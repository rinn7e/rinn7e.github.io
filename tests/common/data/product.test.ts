import { describe, expect, it } from 'vitest'

import { productList } from '@/common/data/product'

describe('product list', () => {
  it('puts the products with a logo first, each group newest first', () => {
    expect(productList.map((product) => product.id)).toEqual([
      'tea-ecosystem',
      'claude-desktop-theme-tuner',
      'damn-center',
      'realworld-conduit',
      'universal-theme-tuner',
      'ninja-adventure-indigo',
      'indigo-game-starter-template',
      'image-overlay',
    ])
  })
})
