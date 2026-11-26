import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import { blogPostOf } from '@/common/data/blog'
import {
  ABOUT_TITLE,
  BLOG_TITLE,
  HANDLE,
  PRIVACY_TITLE,
  PRODUCTS_TITLE,
  blogPostTitleOf,
} from '@/common/seo'
import { type Destination, type NavigationMsg } from '@/common/type/destination'
import { cmdSucceed, scrollToTopCmd } from '@/common/util'
import * as AboutScreen from '@/screen/about-screen'
import * as BlogPostScreen from '@/screen/blog-post-screen'
import * as BlogScreen from '@/screen/blog-screen'
import * as PrivacyScreen from '@/screen/privacy-screen'
import * as ProductsScreen from '@/screen/products-screen'
import {
  type CurrentScreenModel,
  type Model,
  type Msg,
  type ScreenModel,
  currentScreenModelOfMove,
} from '@/type'

// The title of the browser tab for each screen
const titleOf = (destination: Destination): string => {
  switch (destination.screen._tag) {
    case 'ProductsScreen':
      return PRODUCTS_TITLE
    case 'BlogScreen':
      return BLOG_TITLE
    case 'BlogPostScreen':
      return pipe(
        blogPostOf(destination.screen.slug),
        O.fold(
          () => BLOG_TITLE,
          (post) => blogPostTitleOf(post.title),
        ),
      )
    case 'AboutScreen':
      return ABOUT_TITLE
    case 'PrivacyScreen':
      return PRIVACY_TITLE
    case 'NotFoundScreen':
      return `Not found - ${HANDLE}`
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
    case 'BlogScreen':
      return [{ _tag: 'BlogScreenModel', model: BlogScreen.init() }, Cmd.none()]
    // The parser reads only a slug with a post as this screen; any other
    // reads as not found
    case 'BlogPostScreen':
      return pipe(
        blogPostOf(screen.slug),
        O.fold(
          (): [ScreenModel, Cmd<Msg>] => [
            { _tag: 'NotFoundScreenModel' },
            Cmd.none(),
          ],
          (post): [ScreenModel, Cmd<Msg>] => [
            { _tag: 'BlogPostScreenModel', model: BlogPostScreen.init(post) },
            Cmd.none(),
          ],
        ),
      )
    case 'AboutScreen':
      return [
        { _tag: 'AboutScreenModel', model: AboutScreen.init() },
        Cmd.none(),
      ]
    case 'PrivacyScreen':
      return [
        { _tag: 'PrivacyScreenModel', model: PrivacyScreen.init() },
        Cmd.none(),
      ]
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
