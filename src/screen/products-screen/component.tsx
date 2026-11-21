import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import React, { memo } from 'react'

import { ProductGridMemo } from './product-grid/component'
import { ProductPopupMemo } from './product-popup/component'
import { type Props, PropsEq } from './type'

// The grid of every product, and the popup of the product opened over it:
// its card leaves its place in the grid, flies and spins into the popup,
// and the screenshots and the text fade in. Each part is a memo fed only
// what it draws.
const ProductsScreen = ({ model, dispatch }: Props) => (
  <>
    <ProductGridMemo
      category={model.category}
      away={pipe(
        model.popup,
        O.map((popup) => popup.id),
      )}
      isFlipped={model.isFlipped}
      isFirstShow={model.isFirstShow}
      dispatch={dispatch}
    />
    {pipe(
      model.popup,
      O.map((popup) => (
        // Keyed by the product: another product opens a fresh popup
        <ProductPopupMemo
          key={popup.id}
          model={popup}
          isFlipped={model.isFlipped}
          dispatch={(subMsg) => dispatch({ _tag: 'ProductPopupMsg', subMsg })}
        />
      )),
      O.toNullable,
    )}
  </>
)

export const ProductsScreenMemo = memo(ProductsScreen, PropsEq.equals)
