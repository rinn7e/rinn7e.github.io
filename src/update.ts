import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { newSinceOf } from '@/common/data/blog'
import { replaceUrlCmd, updateAndCmd } from '@/common/util'
import * as DebugPanel from '@/component/debug-panel'
import type * as ProfileHeader from '@/component/profile-header'
import {
  initScreenModel,
  navigationMsgHandler,
} from '@/handler/navigation-handler'
import * as AboutScreen from '@/screen/about-screen'
import * as BlogPostScreen from '@/screen/blog-post-screen'
import * as BlogScreen from '@/screen/blog-screen'
import * as PrivacyScreen from '@/screen/privacy-screen'
import * as ProductsScreen from '@/screen/products-screen'
import { type Model, type Msg, sameScreenWith } from '@/type'
import { bootDestinationOf, bootUrlOf } from '@/util'

// `now` is the time of the boot (ms since 1970), passed in by the program so
// `init` stays pure
export const init = (location: Location, now: number): [Model, Cmd<Msg>] => {
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
    {
      screenModel,
      debugPanel: DebugPanel.init(),
      newSince: newSinceOf(now),
    },
    Cmd.batch([bootUrlCmd, screenCmd]),
  ]
}

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'NoOp':
      return [model, Cmd.none()]
    case 'SetNow':
      return [{ ...model, newSince: newSinceOf(msg.now) }, Cmd.none()]
    case 'NavigationMsg':
      return navigationMsgHandler(msg.subMsg, model)
    case 'ProductsScreenMsg':
      return productsScreenMsgHandler(msg.subMsg, model)
    case 'DebugPanelMsg':
      return debugPanelMsgHandler(msg.subMsg, model)
    case 'BlogScreenMsg':
      return blogScreenMsgHandler(msg.subMsg, model)
    case 'BlogPostScreenMsg':
      return blogPostScreenMsgHandler(msg.subMsg, model)
    case 'AboutScreenMsg':
      return aboutScreenMsgHandler(msg.subMsg, model)
    case 'PrivacyScreenMsg':
      return privacyScreenMsgHandler(msg.subMsg, model)
    case 'ProfileHeaderMsg':
      return profileHeaderMsgHandler(msg.subMsg, model)
  }
}

// A message of the Blog screen changes its model in place, only while it
// is the screen shown
const blogScreenMsgHandler = (
  subMsg: BlogScreen.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const { screenModel } = model
  if (screenModel._tag === 'BlogScreenModel') {
    const [screen, screenCmd] = BlogScreen.update(subMsg, screenModel.model)
    return [
      {
        ...model,
        screenModel: sameScreenWith(screenModel)({
          _tag: 'BlogScreenModel',
          model: screen,
        }),
      },
      screenCmd.map((m): Msg => ({ _tag: 'BlogScreenMsg', subMsg: m })),
    ]
  } else {
    return [model, Cmd.none()]
  }
}

// A message of the screen of a post changes its model in place, only while
// it is the screen shown
const blogPostScreenMsgHandler = (
  subMsg: BlogPostScreen.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const { screenModel } = model
  if (screenModel._tag === 'BlogPostScreenModel') {
    const [screen, screenCmd] = BlogPostScreen.update(subMsg, screenModel.model)
    return [
      {
        ...model,
        screenModel: sameScreenWith(screenModel)({
          _tag: 'BlogPostScreenModel',
          model: screen,
        }),
      },
      screenCmd.map((m): Msg => ({ _tag: 'BlogPostScreenMsg', subMsg: m })),
    ]
  } else {
    return [model, Cmd.none()]
  }
}

// A message of the About screen changes its model in place, only while it
// is the screen shown
const aboutScreenMsgHandler = (
  subMsg: AboutScreen.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const { screenModel } = model
  if (screenModel._tag === 'AboutScreenModel') {
    const [screen, screenCmd] = AboutScreen.update(subMsg, screenModel.model)
    return [
      {
        ...model,
        screenModel: sameScreenWith(screenModel)({
          _tag: 'AboutScreenModel',
          model: screen,
        }),
      },
      screenCmd.map((m): Msg => ({ _tag: 'AboutScreenMsg', subMsg: m })),
    ]
  } else {
    return [model, Cmd.none()]
  }
}

// A message of the Privacy screen changes its model in place, only while it
// is the screen shown
const privacyScreenMsgHandler = (
  subMsg: PrivacyScreen.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  const { screenModel } = model
  if (screenModel._tag === 'PrivacyScreenModel') {
    const [screen, screenCmd] = PrivacyScreen.update(subMsg, screenModel.model)
    return [
      {
        ...model,
        screenModel: sameScreenWith(screenModel)({
          _tag: 'PrivacyScreenModel',
          model: screen,
        }),
      },
      screenCmd.map((m): Msg => ({ _tag: 'PrivacyScreenMsg', subMsg: m })),
    ]
  } else {
    return [model, Cmd.none()]
  }
}

// The asks of the header. Flip turns the cards to the side they are not on
// now, read from the model when the ask arrives (the header holds no side).
const profileHeaderMsgHandler = (
  subMsg: ProfileHeader.Msg,
  model: Model,
): [Model, Cmd<Msg>] => {
  switch (subMsg._tag) {
    case 'ToggleFlipAll': {
      const { screenModel } = model
      return screenModel._tag === 'ProductsScreenModel'
        ? productsScreenMsgHandler(
            { _tag: screenModel.model.isFlipped ? 'UnflipAll' : 'FlipAll' },
            model,
          )
        : [model, Cmd.none()]
    }
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
