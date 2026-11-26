import * as EqClass from 'fp-ts/Eq'
import { type Option } from 'fp-ts/Option'
import * as B from 'fp-ts/boolean'
import * as N from 'fp-ts/number'
import * as S from 'fp-ts/string'
import { type Dispatcher } from 'tea-cup-fp'

// The popup of one product over the page, a TEA component of the products
// screen: the screen opens it (`init`), and it runs its own animation and
// slideshow until it has closed (its `update` then answers none).

// Where a card is on the page, in viewport pixels
export type CardRect = {
  readonly left: number
  readonly top: number
  readonly width: number
}

// A flight of the card between two places
export type CardFlight = {
  readonly from: CardRect
  readonly to: CardRect
}

// The animation, as phases the view renders (an animation the next step
// waits for lives in the model, see the stack rules):
// 1. `Measuring`: the panel is rendered with its card hidden, to read where
//    the card lands (`to`); `from` is where the card was in the grid.
// 2. `Flying`: the card is drawn back at `from`, with no transition.
// 3. `Spinning`: the card moves to its place while it spins.
// 4. `Shown`: the screenshots and the text are in, the card follows the
//    pointer.
// 5. `Closing`: the panel starts to fade out, and the card is measured on
//    the panel (`from`) and at its place in the grid (`to`).
// 6. `Returning`: the card flies and spins back to its place in the grid,
//    then the popup closes.
// 7. `FadingOut`: the card is not found in the grid (filtered out), so it
//    fades out with the panel instead, then the popup closes.
export type OpenPhase =
  | { readonly _tag: 'Measuring'; readonly from: CardRect }
  | ({ readonly _tag: 'Flying' } & CardFlight)
  | { readonly _tag: 'Spinning' }
  | { readonly _tag: 'Shown' }
  | { readonly _tag: 'Closing' }
  | ({ readonly _tag: 'Returning' } & CardFlight)
  | { readonly _tag: 'FadingOut' }

export type Model = {
  // The product shown
  readonly id: string
  // Not in the URL: a popup opens on the first slide
  readonly slideIndex: number
  // The video of the slide shown has been played: only then is the player
  // of YouTube loaded. Another slide stops it.
  readonly isPlaying: boolean
  readonly phase: OpenPhase
  // The open this popup is: a late message of an earlier popup carries
  // another `seq` and is dropped. Each phase also takes only the messages
  // of its own step, so one `seq` covers the open and the close.
  readonly seq: number
}

export type Msg =
  | {
      readonly _tag: 'CardMeasured'
      readonly seq: number
      readonly to: Option<CardRect>
    }
  | { readonly _tag: 'CardPlaced'; readonly seq: number }
  | { readonly _tag: 'SpinDone'; readonly seq: number }
  // `isAnimated` false (reduced motion) closes at once
  | { readonly _tag: 'Close'; readonly isAnimated: boolean }
  | {
      readonly _tag: 'CloseMeasured'
      readonly seq: number
      readonly flight: Option<CardFlight>
    }
  | { readonly _tag: 'CloseDone'; readonly seq: number }
  | { readonly _tag: 'ShowSlide'; readonly index: number }
  | { readonly _tag: 'PlayVideo' }
  // The player of YouTube has loaded: it gets its volume, then plays
  | { readonly _tag: 'PlayerLoaded' }
  | { readonly _tag: 'NoOp' }

export const CardRectEq: EqClass.Eq<CardRect> = EqClass.struct({
  left: N.Eq,
  top: N.Eq,
  width: N.Eq,
})

const CardFlightEq: EqClass.Eq<CardFlight> = EqClass.struct({
  from: CardRectEq,
  to: CardRectEq,
})

export const OpenPhaseEq: EqClass.Eq<OpenPhase> = {
  equals: (x, y) => {
    if (x._tag === 'Measuring' && y._tag === 'Measuring') {
      return CardRectEq.equals(x.from, y.from)
    } else if (
      (x._tag === 'Flying' && y._tag === 'Flying') ||
      (x._tag === 'Returning' && y._tag === 'Returning')
    ) {
      return CardFlightEq.equals(x, y)
    } else {
      return x._tag === y._tag
    }
  },
}

export const ModelEq: EqClass.Eq<Model> = EqClass.struct({
  id: S.Eq,
  slideIndex: N.Eq,
  isPlaying: B.Eq,
  phase: OpenPhaseEq,
  seq: N.Eq,
})

export type Props = {
  readonly model: Model
  // Every card shows its back (the Flip button)
  readonly isFlipped: boolean
  readonly dispatch: Dispatcher<Msg>
}

// `dispatch` is left out: the one the screen passes sends the same message
// whatever the model
export const PropsEq: EqClass.Eq<Props> = {
  equals: (x, y) =>
    ModelEq.equals(x.model, y.model) && B.Eq.equals(x.isFlipped, y.isFlipped),
}

export const isClosingPhase = (phase: OpenPhase): boolean =>
  phase._tag === 'Closing' ||
  phase._tag === 'Returning' ||
  phase._tag === 'FadingOut'

// How long the card spins into place, how long it flies back, and how long
// the panel fades out
export const SPIN_MS = 750
export const RETURN_MS = 560
export const CLOSE_MS = 260

// The volume a video starts at, out of 100: quiet enough not to startle a
// visitor who pressed play
export const VIDEO_VOLUME = 20

// The id of the player of YouTube in the popup, for the commands it gets
export const videoPlayerDomId = 'product-video-player'
