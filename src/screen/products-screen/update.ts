import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

import * as ProductPopup from './product-popup'
import { type Model, type Msg } from './type'

// A product opened by its URL shows at once, with no animation
export const init = (
  product: Option<string>,
  category: Option<ProductCategory> = O.none,
  isFirstShow: boolean = false,
): [Model, Cmd<Msg>] => {
  const seq = 0
  const opened = pipe(
    product,
    O.map((id) => ProductPopup.init(id, O.none, seq)),
  )
  return [
    {
      popup: pipe(
        opened,
        O.map(([popup]) => popup),
      ),
      seq,
      isFlipped: false,
      isFirstShow,
      category,
    },
    pipe(
      opened,
      O.fold(
        () => Cmd.none<Msg>(),
        ([, popupCmd]) => popupCmd.map(popupMsg),
      ),
    ),
  ]
}

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'OpenProduct':
      return openProductHandler(msg.id, msg.from)(model)
    case 'ProductPopupMsg':
      return productPopupMsgHandler(msg.subMsg)(model)
    case 'FlipAll':
      return [{ ...model, isFlipped: true }, Cmd.none()]
    case 'UnflipAll':
      return [{ ...model, isFlipped: false }, Cmd.none()]
  }
}

const popupMsg = (subMsg: ProductPopup.Msg): Msg => ({
  _tag: 'ProductPopupMsg',
  subMsg,
})

// Opens the popup of a product, in place of any other (whose card goes back
// to the grid at once). The product already open stays as it is. A card
// that comes back to the grid ends the first show (`isFirstShow`), so it is
// never dealt again, while an open alone lets the deal of the others finish
// its fade.
export const openProductHandler =
  (id: string, from: Option<ProductPopup.CardRect>) =>
  (model: Model): [Model, Cmd<Msg>] => {
    const isOpen = pipe(
      model.popup,
      O.exists((popup) => popup.id === id),
    )
    if (isOpen) {
      return [model, Cmd.none()]
    } else {
      const seq = model.seq + 1
      const [popup, popupCmd] = ProductPopup.init(id, from, seq)
      return [
        {
          ...model,
          popup: O.some(popup),
          isFirstShow: model.isFirstShow && O.isNone(model.popup),
          seq,
        },
        popupCmd.map(popupMsg),
      ]
    }
  }

// A message of the popup goes to it while it is open; once it has closed,
// the screen drops it, and its card shows in the grid again (which ends the
// first show, so the card is not dealt again)
export const productPopupMsgHandler =
  (subMsg: ProductPopup.Msg) =>
  (model: Model): [Model, Cmd<Msg>] =>
    pipe(
      model.popup,
      O.fold(
        (): [Model, Cmd<Msg>] => [model, Cmd.none()],
        (popup): [Model, Cmd<Msg>] => {
          const [updated, popupCmd] = ProductPopup.update(subMsg, popup)
          return [
            {
              ...model,
              popup: updated,
              isFirstShow: model.isFirstShow && O.isSome(updated),
            },
            popupCmd.map(popupMsg),
          ]
        },
      ),
    )
