import {
  Formatter,
  Match,
  Parser,
  Route,
  end,
  format,
  lit,
  parse,
  query,
  zero,
} from '@rinn7e/fp-ts-routing'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

import { type ProductCategory, productList } from '@/common/data/product'

import {
  type Destination,
  type Screen,
  aboutScreen,
  notFoundScreen,
  privacyScreen,
  productsScreen,
} from './type'

// The only code that knows how a destination is spelled in the URL. The
// site is served at the root of rinn7e.com, so a path needs no base.

// Parser
// ------------------------------------------------------------------

// Unknown query keys are dropped, and an id or category that is not known
// reads as every product instead of a page that is not found
const productsParams = t.partial({ product: t.string, category: t.string })

const categoryParam = t.union([
  t.literal('web-apps'),
  t.literal('browser-extensions'),
  t.literal('games'),
  t.literal('developer-tools'),
])

type CategoryParam = t.TypeOf<typeof categoryParam>

const categoryFromParam = (
  param: string | undefined,
): O.Option<ProductCategory> => {
  if (categoryParam.is(param)) {
    switch (param) {
      case 'web-apps':
        return O.some('WebApp')
      case 'browser-extensions':
        return O.some('BrowserExtension')
      case 'games':
        return O.some('Game')
      case 'developer-tools':
        return O.some('DeveloperTool')
    }
  } else {
    return O.none
  }
}

const categoryToParam = (category: ProductCategory): CategoryParam => {
  switch (category) {
    case 'WebApp':
      return 'web-apps'
    case 'BrowserExtension':
      return 'browser-extensions'
    case 'Game':
      return 'games'
    case 'DeveloperTool':
      return 'developer-tools'
  }
}

const productsMatch = query(productsParams).and(end)
const aboutMatch = lit('about').and(end)
const privacyMatch = lit('privacy').and(end)

const anyStrings = new Match<object>(
  new Parser((r) => O.some([{}, new Route([], r.query)])),
  new Formatter((r) => r),
)

const productFromParam = (param: string | undefined): O.Option<string> =>
  pipe(
    O.fromNullable(param),
    O.filter((id) =>
      pipe(
        productList,
        RA.exists((product) => product.id === id),
      ),
    ),
  )

const screenParser: Parser<Screen> = zero<Screen>()
  .alt(
    productsMatch.parser.map(({ product, category }) =>
      productsScreen(productFromParam(product), categoryFromParam(category)),
    ),
  )
  .alt(aboutMatch.parser.map(() => aboutScreen()))
  .alt(privacyMatch.parser.map(() => privacyScreen()))
  .alt(anyStrings.parser.map(() => notFoundScreen()))

// `href`: a full URL (the page's `location.href`). A trailing slash reads
// the same as none (`/about/` is `/about`), since GitHub Pages serves the
// About and Privacy pages from `about/index.html` and `privacy/index.html`.
export const parseDestination = (href: string): Destination => {
  const url = new URL(href)
  const pathname =
    url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname
  return {
    screen: parse(
      screenParser,
      Route.parse(pathname + url.search),
      productsScreen(),
    ),
  }
}

// Formatter
// ------------------------------------------------------------------

export const toUrlString = (destination: Destination): string => {
  const { screen } = destination
  switch (screen._tag) {
    case 'ProductsScreen':
      return format(productsMatch.formatter, {
        category: pipe(screen.category, O.map(categoryToParam), O.toUndefined),
        product: O.toUndefined(screen.product),
      })
    case 'AboutScreen':
      return format(aboutMatch.formatter, {})
    case 'PrivacyScreen':
      return format(privacyMatch.formatter, {})
    case 'NotFoundScreen':
      return '/404'
  }
}
