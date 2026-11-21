import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { replaceUrlCmd, updateAndCmd } from '@/common/util'
import * as DebugPanel from '@/component/debug-panel'
import {
  initScreenModel,
  navigationMsgHandler,
} from '@/handler/navigation-handler'
import * as ProductsScreen from '@/screen/products-screen'
import { type Model, type Msg, sameScreenWith } from '@/type'
import { bootDestinationOf, bootUrlOf } from '@/util'

export const init = (location: Location): [Model, Cmd<Msg>] => {
  const destination = bootDestinationOf(location)
  // The boot: the screen the visitor sees first
  const [screenModel, screenCmd] = initScreenModel(destination, true)
  const bootUrlCmd = pipe(
    bootUrlOf(location, destination),
    O.fold(
      () => Cmd.none<Msg>(),
      (url) => replaceUrlCmd(url).map((noOp): Msg => noOp),
    ),
  )
  return [
    { screenModel, debugPanel: DebugPanel.init() },
    Cmd.batch([bootUrlCmd, screenCmd]),
  ]
}

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'NoOp':
      return [model, Cmd.none()]
    case 'NavigationMsg':
      return navigationMsgHandler(msg.subMsg, model)
    case 'ProductsScreenMsg':
      return productsScreenMsgHandler(msg.subMsg, model)
    case 'DebugPanelMsg':
      return debugPanelMsgHandler(msg.subMsg, model)
  }
}

// The debug panel updates itself; its asks to flip every card over or back go
// to the products screen, when it is the screen shown
const debugPanelMsgHandler = (
  subMsg: DebugPanel.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const [debugPanel, debugPanelCmd] = DebugPanel.update(
    subMsg,
    model.debugPanel,
  )
  return pipe(
    [
      { ...model, debugPanel },
      debugPanelCmd.map((m): Msg => ({ _tag: 'DebugPanelMsg', subMsg: m })),
    ],
    updateAndCmd((updatedModel: Model): [Model, Cmd<Msg>] => {
      switch (subMsg._tag) {
        case 'FlipAllCards':
          return productsScreenMsgHandler({ _tag: 'FlipAll' }, updatedModel)
        case 'UnflipAllCards':
          return productsScreenMsgHandler({ _tag: 'UnflipAll' }, updatedModel)
        case 'TogglePanel':
          return [updatedModel, Cmd.none()]
      }
    }),
  )
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
