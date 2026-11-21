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
import * as t from 'io-ts'

import { type ProductCategory } from '@/common/data/product'

import {
  type Destination,
  type Screen,
  aboutScreen,
  notFoundScreen,
  productsScreen,
} from './type'

// The only code that knows how a destination is spelled in the URL. The
// site is served at the root of rinn7e.com, so a path needs no base.

// Parser
// ------------------------------------------------------------------

const categoryParam = t.union([
  t.literal('web-apps'),
  t.literal('browser-extensions'),
  t.literal('games'),
  t.literal('developer-tools'),
])

type CategoryParam = t.TypeOf<typeof categoryParam>

// Unknown query keys and values are dropped, so `?category=nonsense` reads as
// every product instead of a page that is not found
const productsParams = t.partial({ category: t.string })

const productsMatch = query(productsParams).and(end)
const aboutMatch = lit('about').and(end)

const anyStrings = new Match<object>(
  new Parser((r) => O.some([{}, new Route([], r.query)])),
  new Formatter((r) => r),
)

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

const screenParser: Parser<Screen> = zero<Screen>()
  .alt(
    productsMatch.parser.map(({ category }) =>
      productsScreen(categoryFromParam(category)),
    ),
  )
  .alt(aboutMatch.parser.map(() => aboutScreen()))
  .alt(anyStrings.parser.map(() => notFoundScreen()))

// `href`: a full URL (the page's `location.href`). A trailing slash reads
// the same as none (`/about/` is `/about`), since GitHub Pages serves the
// About page from `about/index.html`.
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
        category: O.isSome(screen.category)
          ? categoryToParam(screen.category.value)
          : undefined,
      })
    case 'AboutScreen':
      return format(aboutMatch.formatter, {})
    case 'NotFoundScreen':
      return '/404'
  }
}
