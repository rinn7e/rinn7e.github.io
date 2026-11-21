import { Cmd } from 'tea-cup-fp'

import { type Destination, type NavigationMsg } from '@/common/type/destination'
import { cmdSucceed, scrollToTopCmd } from '@/common/util'
import * as ProductsScreen from '@/screen/products-screen'
import {
  type CurrentScreenModel,
  type Model,
  type Msg,
  type ScreenModel,
  currentScreenModelOfMove,
} from '@/type'

const SITE_NAME = 'rinn7e'

// The title of the browser tab for each screen
const titleOf = (destination: Destination): string => {
  switch (destination.screen._tag) {
    case 'ProductsScreen':
      return `${SITE_NAME}: open-source work`
    case 'AboutScreen':
      return `About - ${SITE_NAME}`
    case 'NotFoundScreen':
      return `Not found - ${SITE_NAME}`
  }
}

const setTitleCmd = (destination: Destination): Cmd<Msg> =>
  cmdSucceed(() => {
    document.title = titleOf(destination)
  })

// The screen model of `destination`, the one place a move opens a screen.
// Every move opens its screen afresh, with the params of the destination.
// Review: called only by `navigateHandler` and the boot.
export const initScreenModel = (
  destination: Destination,
  isFirstShow: boolean,
): [CurrentScreenModel, Cmd<Msg>] => {
  const [screenModel, screenCmd] = freshScreenModelOf(destination, isFirstShow)
  return [
    currentScreenModelOfMove(screenModel),
    Cmd.batch([screenCmd, setTitleCmd(destination)]),
  ]
}

const freshScreenModelOf = (
  destination: Destination,
  isFirstShow: boolean,
): [ScreenModel, Cmd<Msg>] => {
  const { screen } = destination
  switch (screen._tag) {
    case 'ProductsScreen': {
      const [model, cmd] = ProductsScreen.init(
        screen.product,
        screen.category,
        isFirstShow,
      )
      return [
        { _tag: 'ProductsScreenModel', model },
        cmd.map((subMsg): Msg => ({ _tag: 'ProductsScreenMsg', subMsg })),
      ]
    }
    case 'AboutScreen':
      return [{ _tag: 'AboutScreenModel' }, Cmd.none()]
    case 'NotFoundScreen':
      return [{ _tag: 'NotFoundScreenModel' }, Cmd.none()]
  }
}

// Opens `destination`. A click (`Navigate`) starts the screen at its top;
// the browser's back and forward (`UrlChanged`) leave the scroll to the
// browser.
export const navigateHandler =
  (destination: Destination, isInternal: boolean) =>
  (model: Model): [Model, Cmd<Msg>] => {
    const [screenModel, screenCmd] = initScreenModel(destination, false)
    const updatedModel: Model = { ...model, screenModel }
    if (isInternal) {
      return [updatedModel, Cmd.batch([screenCmd, scrollToTopCmd()])]
    } else {
      return [updatedModel, screenCmd]
    }
  }

// Every move of the app. The URL follows the destination after the step
// (`withUrl`), so nothing here writes it.
export const navigationMsgHandler = (
  subMsg: NavigationMsg,
  model: Model,
): [Model, Cmd<Msg>] => {
  switch (subMsg._tag) {
    case 'Navigate':
      return navigateHandler(subMsg.destination, true)(model)
    case 'UrlChanged':
      return navigateHandler(subMsg.destination, false)(model)
  }
}
