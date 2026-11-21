import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

import { type Brand } from '@/common/type/brand-wrapper'
import { type NavigationMsg, type Screen } from '@/common/type/destination'
import type * as DebugPanel from '@/component/debug-panel'
import type * as ProfileHeader from '@/component/profile-header'
import type * as AboutScreen from '@/screen/about-screen'
import type * as PrivacyScreen from '@/screen/privacy-screen'
import type * as ProductsScreen from '@/screen/products-screen'

// The screen shown, as its model. Its tag and its own fields (the products
// product opened) are the destination's screen (`currentScreenOf`): a
// `currentScreen` field next to it would say the same thing twice.
export type ScreenModel =
  | {
      readonly _tag: 'ProductsScreenModel'
      readonly model: ProductsScreen.Model
    }
  | { readonly _tag: 'AboutScreenModel'; readonly model: AboutScreen.Model }
  | {
      readonly _tag: 'PrivacyScreenModel'
      readonly model: PrivacyScreen.Model
    }
  | { readonly _tag: 'NotFoundScreenModel' }

// The screen shown (`Model.screenModel`). Owned: read it anywhere as a
// `ScreenModel`, but only the two functions below make one (the brand has no
// value). So the screen changes only by a move; its own messages change its
// model in place. Review: a cast to it outside this file changes the screen
// without a move.
declare class _CurrentScreenModelBrand {
  private _currentScreenModelBrand(): void
}

export type CurrentScreenModel = Brand<ScreenModel, _CurrentScreenModelBrand>

// The screen model a move opens. Review: called by the navigation
// (`navigation-handler.ts`) and tests only; anywhere else it changes the
// screen without a move.
export const currentScreenModelOfMove = (
  screenModel: ScreenModel,
): CurrentScreenModel =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  screenModel as CurrentScreenModel

// The screen shown with its model changed in place by its own messages.
// Another screen keeps the one shown: that is a move.
export const sameScreenWith =
  (current: CurrentScreenModel) =>
  (screenModel: ScreenModel): CurrentScreenModel =>
    screenModel._tag === current._tag
      ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (screenModel as CurrentScreenModel)
      : current

export type Model = {
  readonly screenModel: CurrentScreenModel
  readonly debugPanel: DebugPanel.Model
}

export type Msg =
  | { readonly _tag: 'NoOp' }
  | { readonly _tag: 'NavigationMsg'; readonly subMsg: NavigationMsg }
  | {
      readonly _tag: 'ProductsScreenMsg'
      readonly subMsg: ProductsScreen.Msg
    }
  | { readonly _tag: 'DebugPanelMsg'; readonly subMsg: DebugPanel.Msg }
  | { readonly _tag: 'AboutScreenMsg'; readonly subMsg: AboutScreen.Msg }
  | { readonly _tag: 'PrivacyScreenMsg'; readonly subMsg: PrivacyScreen.Msg }
  | {
      readonly _tag: 'ProfileHeaderMsg'
      readonly subMsg: ProfileHeader.Msg
    }

// The product of the popup, while one is open: a param of the destination
const openedProductOf = (model: ProductsScreen.Model): O.Option<string> =>
  pipe(
    model.popup,
    O.map((popup) => popup.id),
  )

// The screen shown (the destination's `screen`, `destinationOf`), read from
// the fields of its model that hold the screen's params
export const currentScreenOf = (screenModel: ScreenModel): Screen => {
  switch (screenModel._tag) {
    case 'ProductsScreenModel':
      return {
        _tag: 'ProductsScreen',
        product: openedProductOf(screenModel.model),
        category: screenModel.model.category,
      }
    case 'AboutScreenModel':
      return { _tag: 'AboutScreen' }
    case 'PrivacyScreenModel':
      return { _tag: 'PrivacyScreen' }
    case 'NotFoundScreenModel':
      return { _tag: 'NotFoundScreen' }
  }
}
