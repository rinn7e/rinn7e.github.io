import type * as EqClass from 'fp-ts/Eq'

import { type Product } from '@/common/data/product'

export type ProductCardSize = 'ColumnCard' | 'PanelCard'

export type Props = {
  readonly product: Product
  readonly size: ProductCardSize
  // Turned over to show its back (the Flip button, the debug panel)
  readonly isFlipped: boolean
  // Tilts and catches the light under the pointer; off while the card flies,
  // so the hover never fights the flight
  readonly isTracked: boolean
}

// `product` is static data, so its id stands for it
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) =>
    x.product.id === y.product.id &&
    x.size === y.size &&
    x.isFlipped === y.isFlipped &&
    x.isTracked === y.isTracked,
}
