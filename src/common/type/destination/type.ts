import * as EqClass from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as S from 'fp-ts/string'

import { type ProductCategory } from '@/common/data/product'

export type ProductsScreen = {
  readonly _tag: 'ProductsScreen'
  // The id of the product opened in place, none when every product shows
  // as its card
  readonly product: Option<string>
  // The category the cards are filtered to, none for every product
  readonly category: Option<ProductCategory>
}

export type AboutScreen = {
  readonly _tag: 'AboutScreen'
}

export type PrivacyScreen = {
  readonly _tag: 'PrivacyScreen'
}

export type NotFoundScreen = {
  readonly _tag: 'NotFoundScreen'
}

export type Screen =
  ProductsScreen | AboutScreen | PrivacyScreen | NotFoundScreen

export const ProductsScreenEq: EqClass.Eq<ProductsScreen> = EqClass.struct({
  _tag: S.Eq,
  product: O.getEq(S.Eq),
  category: O.getEq(S.Eq),
})

export const AboutScreenEq: EqClass.Eq<AboutScreen> = EqClass.struct({
  _tag: S.Eq,
})

export const PrivacyScreenEq: EqClass.Eq<PrivacyScreen> = EqClass.struct({
  _tag: S.Eq,
})

export const NotFoundScreenEq: EqClass.Eq<NotFoundScreen> = EqClass.struct({
  _tag: S.Eq,
})

export const ScreenEq: EqClass.Eq<Screen> = {
  equals: (x, y) => {
    if (x._tag === 'ProductsScreen' && y._tag === 'ProductsScreen') {
      return ProductsScreenEq.equals(x, y)
    } else if (x._tag === 'AboutScreen' && y._tag === 'AboutScreen') {
      return AboutScreenEq.equals(x, y)
    } else if (x._tag === 'PrivacyScreen' && y._tag === 'PrivacyScreen') {
      return PrivacyScreenEq.equals(x, y)
    } else if (x._tag === 'NotFoundScreen' && y._tag === 'NotFoundScreen') {
      return NotFoundScreenEq.equals(x, y)
    } else {
      return false
    }
  },
}

// Where the app is. Never stored: read from the models that show it
// (`destinationOf`), and written to the URL from there.
export type Destination = {
  readonly screen: Screen
}

export const DestinationEq: EqClass.Eq<Destination> = EqClass.struct({
  screen: ScreenEq,
})

export const destinationOfScreen = (screen: Screen): Destination => ({
  screen,
})

export const productsScreen = (
  product: Option<string> = O.none,
  category: Option<ProductCategory> = O.none,
): Screen => ({
  _tag: 'ProductsScreen',
  product,
  category,
})
export const aboutScreen = (): Screen => ({ _tag: 'AboutScreen' })
export const privacyScreen = (): Screen => ({ _tag: 'PrivacyScreen' })
export const notFoundScreen = (): Screen => ({ _tag: 'NotFoundScreen' })

export const defaultDestination = (): Destination =>
  destinationOfScreen(productsScreen())

export const aboutDestination = (): Destination =>
  destinationOfScreen(aboutScreen())

export const privacyDestination = (): Destination =>
  destinationOfScreen(privacyScreen())

// Every move of the app goes through `navigationMsgHandler`. `UrlChanged`
// is the browser's back or forward, the only move that comes from the URL
// after the boot.
export type NavigationMsg =
  | { readonly _tag: 'Navigate'; readonly destination: Destination }
  | { readonly _tag: 'UrlChanged'; readonly destination: Destination }
