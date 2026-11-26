import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { afterNextPaintCmd, delayCmd } from '@/common/util'

import { gridCardDomId, panelCardDomId } from '../common/product-card/dom-id'
import {
  CLOSE_MS,
  type CardFlight,
  type CardRect,
  type Model,
  type Msg,
  type OpenPhase,
  RETURN_MS,
  SPIN_MS,
  isClosingPhase,
} from './type'

// Opens the popup of `id` as the open `seq`: with `from`, its card flies
// from there (measured first); without (reduced motion, or a product opened
// by its URL), it shows at once
export const init = (
  id: string,
  from: Option<CardRect>,
  seq: number,
): [Model, Cmd<Msg>] =>
  pipe(
    from,
    O.fold(
      (): [Model, Cmd<Msg>] => [
        { id, slideIndex: 0, isPlaying: false, phase: { _tag: 'Shown' }, seq },
        Cmd.none(),
      ],
      (rect): [Model, Cmd<Msg>] => [
        {
          id,
          slideIndex: 0,
          isPlaying: false,
          phase: { _tag: 'Measuring', from: rect },
          seq,
        },
        measureCardCmd(id, seq),
      ],
    ),
  )

// The popup after `msg`, or none once it has closed
export const update = (msg: Msg, model: Model): [Option<Model>, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'CardMeasured':
      return keep(cardMeasuredHandler(msg.seq, msg.to)(model))
    case 'CardPlaced':
      return keep(cardPlacedHandler(msg.seq)(model))
    case 'SpinDone':
      return keep([
        isStep(msg.seq, 'Spinning', model)
          ? withPhase({ _tag: 'Shown' })(model)
          : model,
        Cmd.none(),
      ])
    case 'Close':
      return closeHandler(msg.isAnimated)(model)
    case 'CloseMeasured':
      return keep(closeMeasuredHandler(msg.seq, msg.flight)(model))
    case 'CloseDone':
      return isStep(msg.seq, 'Returning', model) ||
        isStep(msg.seq, 'FadingOut', model)
        ? [O.none, Cmd.none()]
        : keep([model, Cmd.none()])
    case 'ShowSlide':
      return keep([
        { ...model, slideIndex: msg.index, isPlaying: false },
        Cmd.none(),
      ])
    case 'PlayVideo':
      return keep([{ ...model, isPlaying: true }, Cmd.none()])
  }
}

const keep = ([model, cmd]: [Model, Cmd<Msg>]): [Option<Model>, Cmd<Msg>] => [
  O.some(model),
  cmd,
]

const withPhase =
  (phase: OpenPhase) =>
  (model: Model): Model => ({ ...model, phase })

// A message of this popup (`seq`) that comes at the step it is for
const isStep = (seq: number, step: OpenPhase['_tag'], model: Model): boolean =>
  seq === model.seq && model.phase._tag === step

// Where the element of `domId` is on the page, if it is there
const rectOf = (domId: string): Option<CardRect> =>
  pipe(
    O.fromNullable(document.getElementById(domId)),
    O.map((element) => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, top: rect.top, width: rect.width }
    }),
  )

const measureCardCmd = (id: string, seq: number): Cmd<Msg> =>
  afterNextPaintCmd(
    (): Option<CardRect> => rectOf(panelCardDomId(id)),
    (to): Msg => ({ _tag: 'CardMeasured', seq, to: O.flatten(to) }),
  )

// Where the card is on the panel, and where its place in the grid is
const measureReturnCmd = (id: string, seq: number): Cmd<Msg> =>
  afterNextPaintCmd(
    (): Option<CardFlight> =>
      pipe(
        O.Do,
        O.apS('from', rectOf(panelCardDomId(id))),
        O.apS('to', rectOf(gridCardDomId(id))),
      ),
    (flight): Msg => ({
      _tag: 'CloseMeasured',
      seq,
      flight: O.flatten(flight),
    }),
  )

// The card's place is known: draw it back where it was clicked, then let it
// fly once that is painted. A card that is not found shows at once.
const cardMeasuredHandler =
  (seq: number, to: Option<CardRect>) =>
  (model: Model): [Model, Cmd<Msg>] => {
    const { phase } = model
    if (seq !== model.seq || phase._tag !== 'Measuring') {
      return [model, Cmd.none()]
    } else if (O.isSome(to)) {
      return [
        withPhase({ _tag: 'Flying', from: phase.from, to: to.value })(model),
        afterNextPaintCmd(
          () => undefined,
          (): Msg => ({ _tag: 'CardPlaced', seq }),
        ),
      ]
    } else {
      return [withPhase({ _tag: 'Shown' })(model), Cmd.none()]
    }
  }

const cardPlacedHandler =
  (seq: number) =>
  (model: Model): [Model, Cmd<Msg>] =>
    isStep(seq, 'Flying', model)
      ? [
          withPhase({ _tag: 'Spinning' })(model),
          delayCmd<Msg>(SPIN_MS, { _tag: 'SpinDone', seq }),
        ]
      : [model, Cmd.none()]

// Animated, the panel fades out while the card flies back to its place in
// the grid (measured first); otherwise (reduced motion) the popup closes at
// once. A popup already closing goes on as it was.
const closeHandler =
  (isAnimated: boolean) =>
  (model: Model): [Option<Model>, Cmd<Msg>] => {
    if (isClosingPhase(model.phase)) {
      return keep([model, Cmd.none()])
    } else if (isAnimated) {
      return keep([
        withPhase({ _tag: 'Closing' })(model),
        measureReturnCmd(model.id, model.seq),
      ])
    } else {
      return [O.none, Cmd.none()]
    }
  }

// The card's place in the grid is known: it flies back there. A card that
// is not in the grid (filtered out) fades out with the panel instead.
const closeMeasuredHandler =
  (seq: number, flight: Option<CardFlight>) =>
  (model: Model): [Model, Cmd<Msg>] => {
    if (!isStep(seq, 'Closing', model)) {
      return [model, Cmd.none()]
    } else if (O.isSome(flight)) {
      return [
        withPhase({ _tag: 'Returning', ...flight.value })(model),
        delayCmd<Msg>(RETURN_MS, { _tag: 'CloseDone', seq }),
      ]
    } else {
      return [
        withPhase({ _tag: 'FadingOut' })(model),
        delayCmd<Msg>(CLOSE_MS, { _tag: 'CloseDone', seq }),
      ]
    }
  }
