import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { init, update } from '@/screen/products-screen'

describe('products screen update', () => {
  it('starts on the category of its destination', () => {
    expect(init(O.some('Game'))[0]).toEqual({ category: O.some('Game') })
  })

  it('picks a category, and back to every product', () => {
    const [model] = init(O.none)
    const [gameModel] = update(
      { _tag: 'SelectCategory', category: O.some('Game') },
      model,
    )
    expect(gameModel.category).toEqual(O.some('Game'))
    const [allModel] = update(
      { _tag: 'SelectCategory', category: O.none },
      gameModel,
    )
    expect(allModel.category).toEqual(O.none)
  })
})
