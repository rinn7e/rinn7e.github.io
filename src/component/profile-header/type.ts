import type * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as B from 'fp-ts/boolean'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

// What the header draws for the screen shown, one case per kind of screen,
// so a value that belongs to one case lives only there: the category and
// the side of the cards exist only with the cards (the products tab), so
// Flip, Clear filter and a ringed highlight can show nowhere else.
export type HeaderScreen =
  | {
      readonly _tag: 'ProductsHeader'
      // The category the cards are filtered to (its highlight is ringed,
      // and Clear filter shows)
      readonly category: Option<ProductCategory>
      // Whether the cards show their back (the label of Flip)
      readonly isFlipped: boolean
    }
  // The list of posts
  | { readonly _tag: 'BlogHeader' }
  // One post: a slim header, so the post starts at the top of the page
  | { readonly _tag: 'BlogPostHeader' }
  | { readonly _tag: 'AboutHeader' }
  // A page with no tab: Privacy, Not found
  | { readonly _tag: 'NoTabHeader' }

export const HeaderScreenEq: EqClass.Eq<HeaderScreen> = {
  equals: (x, y) => {
    if (x._tag === 'ProductsHeader' && y._tag === 'ProductsHeader') {
      return (
        O.getEq(S.Eq).equals(x.category, y.category) &&
        B.Eq.equals(x.isFlipped, y.isFlipped)
      )
    } else {
      return x._tag === y._tag
    }
  },
}

// The header asks; the app decides. Flip turns every card over, or back,
// whatever their side is when the ask arrives.
export type Msg = { readonly _tag: 'ToggleFlipAll' }

// What the header draws, not the screen it comes from: opening a product
// changes the screen but not its `HeaderScreen`, so the header does not
// draw again
export type Props = {
  readonly headerScreen: HeaderScreen
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the app passes sends the same message
// whatever the model, so an older one does the same
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) => HeaderScreenEq.equals(x.headerScreen, y.headerScreen),
}
