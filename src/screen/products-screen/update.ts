import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'
import { afterNextPaintCmd, delayCmd } from '@/common/util'

import {
  CLOSE_MS,
  type CardRect,
  type Model,
  type Msg,
  type OpenPhase,
  type OpenedProduct,
  RETURN_MS,
  SPIN_MS,
  gridCardDomId,
  panelCardDomId,
} from './type'

const shown: OpenPhase = { _tag: 'Shown' }

// A product opened by its URL shows at once, with no animation
export const init = (
  product: Option<string>,
  category: Option<ProductCategory> = O.none,
  isFirstShow: boolean = false,
): [Model, Cmd<Msg>] => [
  {
    openedList: pipe(
      product,
      O.fold(
        () => [],
        (id) => [{ id, slideIndex: 0, phase: shown, seq: 0 }],
      ),
    ),
    returnedList: [],
    seq: 0,
    isFlipped: false,
    isFirstShow,
    category,
  },
  Cmd.none(),
]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'OpenProduct':
      return openProductHandler(msg.id, msg.from)(model)
    case 'CardMeasured':
      return cardMeasuredHandler(msg.seq, msg.to)(model)
    case 'CardPlaced':
      return cardPlacedHandler(msg.seq)(model)
    case 'SpinDone':
      return [withPhaseOf(msg.seq, shown)(model), Cmd.none()]
    case 'CloseProduct':
      return closeProductHandler(msg.id, msg.isAnimated)(model)
    case 'CloseMeasured':
      return closeMeasuredHandler(msg.seq, msg.flight)(model)
    case 'CloseDone':
      return closeDoneHandler(msg.seq)(model)
    case 'ShowSlide':
      return showSlideHandler(msg.id, msg.index)(model)
    case 'FlipAll':
      return [{ ...model, isFlipped: true }, Cmd.none()]
    case 'UnflipAll':
      return [{ ...model, isFlipped: false }, Cmd.none()]
  }
}

const idsOf = (openedList: readonly OpenedProduct[]): readonly string[] =>
  pipe(
    openedList,
    RA.map((opened) => opened.id),
  )

const isOpen =
  (id: string) =>
  (model: Model): boolean =>
    pipe(
      model.openedList,
      RA.exists((opened) => opened.id === id),
    )

// Opens a product, and closes any other: with `from`, its card flies from
// there; without, it shows at once. A product already open stays as it is.
export const openProductHandler =
  (id: string, from: Option<CardRect>) =>
  (model: Model): [Model, Cmd<Msg>] => {
    if (isOpen(id)(model)) {
      return [model, Cmd.none()]
    } else {
      const seq = model.seq + 1
      const phase: OpenPhase = pipe(
        from,
        O.fold(
          (): OpenPhase => shown,
          (rect): OpenPhase => ({ _tag: 'Measuring', from: rect }),
        ),
      )
      const updatedModel: Model = {
        ...model,
        openedList: [{ id, slideIndex: 0, phase, seq }],
        // The products open before go back to their cards
        returnedList: idsOf(model.openedList),
        seq,
      }
      if (phase._tag === 'Measuring') {
        return [updatedModel, measureCardCmd(id, seq)]
      } else {
        return [updatedModel, Cmd.none()]
      }
    }
  }

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
    () =>
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

// The product of an open or close still going on, by its `seq`
const openedOf = (seq: number, model: Model): Option<OpenedProduct> =>
  pipe(
    model.openedList,
    RA.findFirst((opened) => opened.seq === seq),
  )

// Sets the phase of every product of the open or close `seq`
const withPhaseOf =
  (seq: number, phase: OpenPhase) =>
  (model: Model): Model => ({
    ...model,
    openedList: pipe(
      model.openedList,
      RA.map((opened) => (opened.seq === seq ? { ...opened, phase } : opened)),
    ),
  })

// The card's place is known: draw it back where it was clicked, then let it
// fly once that is painted. A card that is not found shows at once.
export const cardMeasuredHandler =
  (seq: number, to: Option<CardRect>) =>
  (model: Model): [Model, Cmd<Msg>] =>
    pipe(
      openedOf(seq, model),
      O.fold(
        (): [Model, Cmd<Msg>] => [model, Cmd.none()],
        (opened): [Model, Cmd<Msg>] => {
          if (opened.phase._tag === 'Measuring' && O.isSome(to)) {
            return [
              withPhaseOf(seq, {
                _tag: 'Flying',
                from: opened.phase.from,
                to: to.value,
              })(model),
              afterNextPaintCmd(
                () => undefined,
                (): Msg => ({ _tag: 'CardPlaced', seq }),
              ),
            ]
          } else {
            return [withPhaseOf(seq, shown)(model), Cmd.none()]
          }
        },
      ),
    )

export const cardPlacedHandler =
  (seq: number) =>
  (model: Model): [Model, Cmd<Msg>] =>
    pipe(
      openedOf(seq, model),
      O.fold(
        (): [Model, Cmd<Msg>] => [model, Cmd.none()],
        (): [Model, Cmd<Msg>] => [
          withPhaseOf(seq, { _tag: 'Spinning' })(model),
          delayCmd<Msg>(SPIN_MS, { _tag: 'SpinDone', seq }),
        ],
      ),
    )

// Closes the products for which `isClosed` holds: animated, as one close
// with its own `seq`, the panel fades out while the card flies back to its
// place in the grid (measured first); otherwise (reduced motion) they close
// at once
const closeWhere =
  (isClosed: (opened: OpenedProduct) => boolean, isAnimated: boolean) =>
  (model: Model): [Model, Cmd<Msg>] => {
    const closedList = pipe(model.openedList, RA.filter(isClosed))
    if (RA.isEmpty(closedList)) {
      return [model, Cmd.none()]
    } else {
      const seq = model.seq + 1
      if (isAnimated) {
        return [
          {
            ...model,
            openedList: pipe(
              model.openedList,
              RA.map((opened): OpenedProduct =>
                isClosed(opened)
                  ? { ...opened, phase: { _tag: 'Closing' }, seq }
                  : opened,
              ),
            ),
            seq,
          },
          Cmd.batch(
            pipe(
              closedList,
              RA.map((opened) => measureReturnCmd(opened.id, seq)),
            ),
          ),
        ]
      } else {
        return [
          {
            ...model,
            openedList: pipe(
              model.openedList,
              RA.filter((opened) => !isClosed(opened)),
            ),
            returnedList: idsOf(closedList),
            seq,
          },
          Cmd.none(),
        ]
      }
    }
  }

export const closeProductHandler = (id: string, isAnimated: boolean) =>
  closeWhere((opened) => opened.id === id, isAnimated)

// The card's place in the grid is known: it flies back there. A card that
// is not in the grid (filtered out) fades out with the panel instead.
export const closeMeasuredHandler =
  (
    seq: number,
    flight: Option<{ readonly from: CardRect; readonly to: CardRect }>,
  ) =>
  (model: Model): [Model, Cmd<Msg>] =>
    pipe(
      openedOf(seq, model),
      O.fold(
        (): [Model, Cmd<Msg>] => [model, Cmd.none()],
        (opened): [Model, Cmd<Msg>] => {
          if (opened.phase._tag !== 'Closing') {
            return [model, Cmd.none()]
          } else if (O.isSome(flight)) {
            return [
              withPhaseOf(seq, { _tag: 'Returning', ...flight.value })(model),
              delayCmd<Msg>(RETURN_MS, { _tag: 'CloseDone', seq }),
            ]
          } else {
            return [
              withPhaseOf(seq, { _tag: 'FadingOut' })(model),
              delayCmd<Msg>(CLOSE_MS, { _tag: 'CloseDone', seq }),
            ]
          }
        },
      ),
    )

// The cards of the close `seq` are back in the grid (or faded out): the
// products close
export const closeDoneHandler =
  (seq: number) =>
  (model: Model): [Model, Cmd<Msg>] => {
    const closedList = pipe(
      model.openedList,
      RA.filter((opened) => opened.seq === seq),
    )
    return [
      {
        ...model,
        openedList: pipe(
          model.openedList,
          RA.filter((opened) => opened.seq !== seq),
        ),
        returnedList: idsOf(closedList),
      },
      Cmd.none(),
    ]
  }

export const showSlideHandler =
  (id: string, index: number) =>
  (model: Model): [Model, Cmd<Msg>] => [
    {
      ...model,
      openedList: pipe(
        model.openedList,
        RA.map((opened) =>
          opened.id === id ? { ...opened, slideIndex: index } : opened,
        ),
      ),
    },
    Cmd.none(),
  ]
