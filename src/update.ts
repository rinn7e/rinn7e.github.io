import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { replaceUrlCmd } from '@/common/util'
import {
  initScreenModel,
  navigationMsgHandler,
} from '@/handler/navigation-handler'
import * as ProductsScreen from '@/screen/products-screen'
import { type Model, type Msg, sameScreenWith } from '@/type'
import { bootDestinationOf, bootUrlOf } from '@/util'

export const init = (location: Location): [Model, Cmd<Msg>] => {
  const destination = bootDestinationOf(location)
  const [screenModel, screenCmd] = initScreenModel(destination)
  const bootUrlCmd = pipe(
    bootUrlOf(location, destination),
    O.fold(
      () => Cmd.none<Msg>(),
      (url) => replaceUrlCmd(url).map((noOp): Msg => noOp),
    ),
  )
  return [{ screenModel }, Cmd.batch([bootUrlCmd, screenCmd])]
}

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'NoOp':
      return [model, Cmd.none()]
    case 'NavigationMsg':
      return navigationMsgHandler(msg.subMsg, model)
    case 'ProductsScreenMsg':
      return productsScreenMsgHandler(msg.subMsg, model)
  }
}

// A message of the products screen changes its model in place, only while
// it is the screen shown (a late message of a screen left is dropped)
const productsScreenMsgHandler = (
  subMsg: ProductsScreen.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const { screenModel } = model
  if (screenModel._tag === 'ProductsScreenModel') {
    const [screen, screenCmd] = ProductsScreen.update(subMsg, screenModel.model)
    return [
      {
        ...model,
        screenModel: sameScreenWith(screenModel)({
          _tag: 'ProductsScreenModel',
          model: screen,
        }),
      },
      screenCmd.map((m): Msg => ({ _tag: 'ProductsScreenMsg', subMsg: m })),
    ]
  } else {
    return [model, Cmd.none()]
  }
}
