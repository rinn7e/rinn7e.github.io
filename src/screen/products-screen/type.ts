import * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as B from 'fp-ts/boolean'
import * as N from 'fp-ts/number'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

// Where a card is on the page, in viewport pixels
export type CardRect = {
  readonly left: number
  readonly top: number
  readonly width: number
}

// The animation of a product opening, as phases the view renders (an
// animation the next step waits for lives in the model, see the stack rules):
// 1. `Measuring`: the panel is rendered with its card hidden, to read where
//    the card lands (`to`); `from` is where the card was in the column.
// 2. `Flying`: the card is drawn back at `from`, with no transition.
// 3. `Spinning`: the card moves to its place while it spins.
// 4. `Shown`: the screenshots and the text fade in.
// 5. `Closing`: the panel fades out, then the product closes.
export type OpenPhase =
  | { readonly _tag: 'Measuring'; readonly from: CardRect }
  | { readonly _tag: 'Flying'; readonly from: CardRect; readonly to: CardRect }
  | { readonly _tag: 'Spinning' }
  | { readonly _tag: 'Shown' }
  | { readonly _tag: 'Closing' }

// A product opened in place, with the screenshot its slideshow shows
export type OpenedProduct = {
  readonly id: string
  // Not in the URL: an opened product starts on its first screenshot
  readonly slideIndex: number
  readonly phase: OpenPhase
  // The open or close this product is part of: a late message of an earlier
  // one carries an older `seq` and is dropped
  readonly seq: number
}

export type Model = {
  // The products opened in place; empty when every product shows as its
  // card. A click opens one product and closes the others. When exactly
  // one is open, it is a param of the destination and the URL follows it.
  readonly openedList: readonly OpenedProduct[]
  // The products just closed, whose cards come back with their own
  // animation instead of being dealt again
  readonly returnedList: readonly string[]
  // Counts the opens and closes, to tag each with its own `seq`
  readonly seq: number
  // Every card shows its back (from the debug panel)
  readonly isFlipped: boolean
  // The cards come in with a short fade only when this screen is the first
  // the visitor sees; a switch of tab or category shows them at once
  readonly isFirstShow: boolean
  // The category the cards are filtered to: a param of the destination, set
  // by `init` (a highlight of the profile is a link to it)
  readonly category: Option<ProductCategory>
}

export type Msg =
  // `from`: where the card was clicked, none to open with no animation
  // (reduced motion)
  | {
      readonly _tag: 'OpenProduct'
      readonly id: string
      readonly from: Option<CardRect>
    }
  | {
      readonly _tag: 'CardMeasured'
      readonly seq: number
      readonly to: Option<CardRect>
    }
  | { readonly _tag: 'CardPlaced'; readonly seq: number }
  | { readonly _tag: 'SpinDone'; readonly seq: number }
  | {
      readonly _tag: 'CloseProduct'
      readonly id: string
      readonly isAnimated: boolean
    }
  | { readonly _tag: 'CloseDone'; readonly seq: number }
  | {
      readonly _tag: 'ShowSlide'
      readonly id: string
      readonly index: number
    }
  // From the debug panel, through the app
  | { readonly _tag: 'FlipAll' }
  | { readonly _tag: 'UnflipAll' }

export const CardRectEq: EqClass.Eq<CardRect> = EqClass.struct({
  left: N.Eq,
  top: N.Eq,
  width: N.Eq,
})

export const OpenPhaseEq: EqClass.Eq<OpenPhase> = {
  equals: (x, y) => {
    if (x._tag === 'Measuring' && y._tag === 'Measuring') {
      return CardRectEq.equals(x.from, y.from)
    } else if (x._tag === 'Flying' && y._tag === 'Flying') {
      return CardRectEq.equals(x.from, y.from) && CardRectEq.equals(x.to, y.to)
    } else {
      return x._tag === y._tag
    }
  },
}

export const OpenedProductEq: EqClass.Eq<OpenedProduct> = EqClass.struct({
  id: S.Eq,
  slideIndex: N.Eq,
  phase: OpenPhaseEq,
  seq: N.Eq,
})

export const ModelEq: EqClass.Eq<Model> = EqClass.struct({
  openedList: RA.getEq(OpenedProductEq),
  returnedList: RA.getEq(S.Eq),
  seq: N.Eq,
  isFlipped: B.Eq,
  isFirstShow: B.Eq,
  category: O.getEq(S.Eq),
})

export type Props = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: tea-cup gives a stable one for the screen
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) => ModelEq.equals(x.model, y.model),
}

// The DOM id of the card on the panel, measured when it lands
export const panelCardDomId = (id: string): string => `product-card-${id}`

// How long the card spins into place, and how long the panel fades out
export const SPIN_MS = 750
export const CLOSE_MS = 260
