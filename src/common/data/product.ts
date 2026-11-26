import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as Ord from 'fp-ts/Ord'
import * as RA from 'fp-ts/ReadonlyArray'
import * as B from 'fp-ts/boolean'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'

// The products shown on the landing page: open source, public repositories
// of github.com/rinn7e. Libraries are left out on purpose.

export type ProductCategory =
  'WebApp' | 'BrowserExtension' | 'Game' | 'DeveloperTool'

export const productCategoryList: readonly ProductCategory[] = [
  'WebApp',
  'BrowserExtension',
  'Game',
  'DeveloperTool',
]

export type ProductLink =
  | { readonly _tag: 'LiveLink'; readonly url: string; readonly label: string }
  | { readonly _tag: 'ChromeWebStoreLink'; readonly url: string }
  | { readonly _tag: 'FirefoxAddonsLink'; readonly url: string }
  | { readonly _tag: 'PlayLink'; readonly url: string }
  | { readonly _tag: 'SourceLink'; readonly url: string }

// The logo of a product, or a monogram for a product that has none of its own
export type ProductLogo =
  | { readonly _tag: 'ImageLogo'; readonly src: string }
  | { readonly _tag: 'MonogramLogo'; readonly letters: string }

// One slide of the slideshow: a screenshot in `public/shot/<product id>/`,
// or a video on YouTube. A video shows its poster (a screenshot of this
// site) until the visitor plays it, so YouTube sees nothing before that.
export type ProductSlide =
  | { readonly _tag: 'ImageSlide'; readonly src: string; readonly alt: string }
  | {
      readonly _tag: 'VideoSlide'
      // The id of the video, as in `youtube.com/watch?v=<id>`
      readonly youtubeId: string
      // Its title on YouTube, for the player and screen readers
      readonly title: string
      readonly poster: string
    }

export type Product = {
  // Spelled in the URL (`/?product=<id>`)
  readonly id: string
  // Shown on the site; a hidden product is left out everywhere, as if it
  // were not in the list (its card, the counts, the search data, its URL)
  readonly isVisible: boolean
  readonly name: string
  // The name printed on its card, short enough for the width of the card
  readonly cardName: string
  // A few words at the bottom of its card on what it is
  readonly cardTagline: string
  // A short label of what it is, shown under the name
  readonly kind: string
  readonly description: string
  readonly categoryList: readonly ProductCategory[]
  readonly logo: ProductLogo
  // The color of its card, behind the logo
  readonly color: string
  readonly slideList: readonly ProductSlide[]
  // Pixel art keeps its hard edges when scaled
  readonly isPixelArt: boolean
  readonly linkList: readonly ProductLink[]
  // When its repository was created on GitHub (ISO 8601, UTC), for the order
  readonly createdAt: string
}

const sourceLink = (repository: string): ProductLink => ({
  _tag: 'SourceLink',
  url: `https://github.com/rinn7e/${repository}`,
})

const imageLogo = (src: string): ProductLogo => ({ _tag: 'ImageLogo', src })

const monogramLogo = (letters: string): ProductLogo => ({
  _tag: 'MonogramLogo',
  letters,
})

const slidesOf = (
  id: string,
  altList: readonly string[],
): readonly ProductSlide[] =>
  pipe(
    altList,
    RA.mapWithIndex((index, alt): ProductSlide => ({
      _tag: 'ImageSlide',
      src: `shot/${id}/${index + 1}.webp`,
      alt,
    })),
  )

// The video of a product, on the poster of its first screenshot
const videoSlideOf = (
  id: string,
  youtubeId: string,
  title: string,
): ProductSlide => ({
  _tag: 'VideoSlide',
  youtubeId,
  title,
  poster: `shot/${id}/1.webp`,
})

const unorderedProductList: readonly Product[] = [
  {
    id: 'damn-center',
    isVisible: true,
    createdAt: '2026-06-08T01:39:07Z',
    name: 'Damn Center',
    cardName: 'Damn Center',
    cardTagline: 'Center any website',
    kind: 'Browser extension',
    description:
      'Center any website on a widescreen or ultrawide monitor, with per-site padding, rulers, themes and patterns.',
    categoryList: ['BrowserExtension'],
    logo: imageLogo('logo/damn-center.png'),
    color: '#2a9d8f',
    slideList: [
      videoSlideOf(
        'damn-center',
        'GnFG-Eb1EGc',
        'Damn Center the page (V2): Center Any Website on Wide Screens - Chrome/Firefox Extension',
      ),
      ...slidesOf('damn-center', [
        'The Damn Center popup next to a website centered on a wide screen',
        'The popup with its padding, side and theme settings',
        'A match for one site, with its own padding',
      ]),
    ],
    isPixelArt: false,
    linkList: [
      {
        _tag: 'ChromeWebStoreLink',
        url: 'https://chromewebstore.google.com/detail/damn-center/jljnmcioeicnlafnjmgknjgegnaccaii',
      },
      {
        _tag: 'FirefoxAddonsLink',
        url: 'https://addons.mozilla.org/en-US/firefox/addon/damn-center/',
      },
      sourceLink('damn-center-extension'),
    ],
  },
  {
    id: 'claude-desktop-theme-tuner',
    isVisible: true,
    createdAt: '2026-10-24T02:36:37Z',
    name: 'Claude Desktop Theme Tuner',
    cardName: 'Theme Tuner',
    cardTagline: 'Theme the Claude app',
    kind: 'Web app and plugin',
    description:
      'Pick, tune and copy a color theme for the Claude desktop app, with a live preview in light and dark mode.',
    categoryList: ['WebApp', 'DeveloperTool'],
    logo: imageLogo('logo/claude-desktop-theme-tuner.svg'),
    color: '#6d5bd0',
    slideList: [
      videoSlideOf(
        'claude-desktop-theme-tuner',
        'DfnZwI23iNM',
        'Claude Desktop Theme Tuner (V1): Theme the Claude Desktop App (30 Presets, Light & Dark)',
      ),
      ...slidesOf('claude-desktop-theme-tuner', [
        'The theme tuner with its presets and knobs, and a live preview of the app in both modes',
      ]),
    ],
    isPixelArt: false,
    linkList: [
      {
        _tag: 'LiveLink',
        url: 'https://rinn7e.com/claude-desktop-theme-tuner/',
        label: 'Open the app',
      },
      sourceLink('claude-desktop-theme-tuner'),
    ],
  },
  {
    id: 'tea-ecosystem',
    isVisible: true,
    createdAt: '2026-11-13T03:33:11Z',
    name: 'TEA Ecosystem',
    cardName: 'TEA Ecosystem',
    cardTagline: 'TEA in every language',
    kind: 'Website',
    description:
      'A catalog of The Elm Architecture in every language and framework, each one graded against Elm.',
    categoryList: ['WebApp'],
    logo: imageLogo('logo/tea-ecosystem.svg'),
    color: '#1f7fd1',
    slideList: slidesOf('tea-ecosystem', [
      'The catalog with its language icons and entries',
      'The rubric: what counts as The Elm Architecture',
    ]),
    isPixelArt: false,
    linkList: [
      {
        _tag: 'LiveLink',
        url: 'https://tea.rinn7e.com/',
        label: 'tea.rinn7e.com',
      },
      sourceLink('tea-ecosystem'),
    ],
  },
  {
    id: 'realworld-conduit',
    isVisible: false,
    createdAt: '2026-05-17T08:58:23Z',
    name: 'RealWorld Conduit',
    cardName: 'Conduit',
    cardTagline: 'Full-stack RealWorld',
    kind: 'Full-stack app',
    description:
      'A type-safe RealWorld app: a Haskell Servant backend, React frontends on react-tea-cup and an admin dashboard.',
    categoryList: ['WebApp'],
    logo: imageLogo('logo/realworld-conduit.svg'),
    color: '#3f9d4c',
    slideList: slidesOf('realworld-conduit', [
      'The Conduit home page with its global feed and popular tags',
      'An article page',
    ]),
    isPixelArt: false,
    linkList: [
      {
        _tag: 'LiveLink',
        url: 'https://conduit.rinn7e.com/',
        label: 'conduit.rinn7e.com',
      },
      sourceLink('realworld-fullstack-react-tea-cup-haskell'),
    ],
  },
  {
    id: 'ninja-adventure-indigo',
    isVisible: false,
    createdAt: '2026-09-29T08:36:19Z',
    name: 'Ninja Adventure',
    cardName: 'Ninja Adventure',
    cardTagline: 'A Scala 3 browser game',
    kind: 'Browser game',
    description:
      'Ninja Adventure rewritten in Scala 3 with the Indigo engine, to show how a real game works in TEA style.',
    categoryList: ['Game'],
    logo: monogramLogo('NA'),
    color: '#6a8f3a',
    slideList: slidesOf('ninja-adventure-indigo', [
      'The forest path, with the player and followers',
      'The swamp in the rain',
      'Talking to a villager',
      'The dungeon and its monsters',
      'The north village',
    ]),
    isPixelArt: true,
    linkList: [
      {
        _tag: 'PlayLink',
        url: 'https://rinn7e.com/ninja-adventure-indigo/',
      },
      sourceLink('ninja-adventure-indigo'),
    ],
  },
  {
    id: 'indigo-game-starter-template',
    isVisible: false,
    createdAt: '2026-09-29T05:31:21Z',
    name: 'Indigo Game Starter',
    cardName: 'Indigo Starter',
    cardTagline: 'Indigo game template',
    kind: 'Game template',
    description:
      'A starter template for Indigo games in Scala 3, shaped like a TEA app, with Slime Quest, a small RPG, to build on.',
    categoryList: ['Game', 'DeveloperTool'],
    logo: monogramLogo('IG'),
    color: '#4f46b8',
    slideList: slidesOf('indigo-game-starter-template', [
      'The title screen of Slime Quest',
      'The world map, with a quest to talk to the elder',
      'A turn-based battle with a slime',
    ]),
    isPixelArt: true,
    linkList: [
      {
        _tag: 'PlayLink',
        url: 'https://rinn7e.com/indigo-game-starter-template/',
      },
      sourceLink('indigo-game-starter-template'),
    ],
  },
  {
    id: 'image-overlay',
    isVisible: false,
    createdAt: '2026-08-11T06:29:23Z',
    name: 'Image Overlay',
    cardName: 'Image Overlay',
    cardTagline: 'Overlay for macOS',
    kind: 'macOS command line tool',
    description:
      'Float a semi-transparent image over every window, to line up a design with the page you built.',
    categoryList: ['DeveloperTool'],
    logo: monogramLogo('IO'),
    color: '#b44fa8',
    slideList: slidesOf('image-overlay', [
      'The options of the command',
      'A design floating at half opacity over a page in the browser, started from the terminal',
      'A design composed over a screenshot, where the differences show as a ghost image',
    ]),
    isPixelArt: false,
    linkList: [sourceLink('image-overlay')],
  },
  {
    id: 'universal-theme-tuner',
    isVisible: false,
    createdAt: '2026-10-18T03:49:52Z',
    name: 'Universal Theme Tuner',
    cardName: 'Universal Tuner',
    cardTagline: 'Themes for your tools',
    kind: 'Themes and extension',
    description:
      'Solarized themes for VS Code with a live tuning panel, and Solarize, an extension that recolors websites.',
    categoryList: ['DeveloperTool', 'BrowserExtension'],
    logo: monogramLogo('UT'),
    color: '#b58900',
    slideList: slidesOf('universal-theme-tuner', [
      'The VS Code Theme Tuner panel with the surface, text and syntax colors',
      'The Claude desktop app in Solarized Light',
      'The Solarize popup',
      'A website recolored by Solarize',
    ]),
    isPixelArt: false,
    linkList: [sourceLink('universal-theme-tuner')],
  },
]

// The products with a logo of their own come first, then the ones shown
// with a monogram; in each group, the newest repository first
const hasLogoFirstOrd: Ord.Ord<Product> = pipe(
  B.Ord,
  Ord.reverse,
  Ord.contramap((product: Product) => product.logo._tag === 'ImageLogo'),
)

const newestFirstOrd: Ord.Ord<Product> = pipe(
  S.Ord,
  Ord.reverse,
  Ord.contramap((product: Product) => product.createdAt),
)

// The one place the card of a product links to straight away, without
// opening it: the live app, else the game, else the browser stores, else the
// code. An extension in both stores links to the Chrome Web Store, and to
// Firefox Add-ons in Firefox (`firefoxUrl`): the page is rendered ahead of
// time, where no browser is known, so the click picks it.
export type QuickLink = {
  readonly label: string
  readonly url: string
  readonly firefoxUrl: Option<string>
}

const urlOfTag = (
  tag: ProductLink['_tag'],
  linkList: readonly ProductLink[],
): Option<string> =>
  pipe(
    linkList,
    RA.findFirst((link) => link._tag === tag),
    O.map((link) => link.url),
  )

const storeQuickLinkOf = (
  linkList: readonly ProductLink[],
): Option<QuickLink> => {
  const chrome = urlOfTag('ChromeWebStoreLink', linkList)
  const firefox = urlOfTag('FirefoxAddonsLink', linkList)
  if (O.isSome(chrome) && O.isSome(firefox)) {
    return O.some({
      label: 'Add to browser',
      url: chrome.value,
      firefoxUrl: firefox,
    })
  } else if (O.isSome(chrome)) {
    return O.some({
      label: 'Chrome Web Store',
      url: chrome.value,
      firefoxUrl: O.none,
    })
  } else {
    return pipe(
      firefox,
      O.map((url): QuickLink => ({
        label: 'Firefox Add-ons',
        url,
        firefoxUrl: O.none,
      })),
    )
  }
}

export const quickLinkOf = (product: Product): Option<QuickLink> =>
  pipe(
    product.linkList,
    RA.findFirstMap((link): Option<QuickLink> =>
      link._tag === 'LiveLink'
        ? O.some({ label: link.label, url: link.url, firefoxUrl: O.none })
        : O.none,
    ),
    O.alt(() =>
      pipe(
        urlOfTag('PlayLink', product.linkList),
        O.map((url): QuickLink => ({ label: 'Play', url, firefoxUrl: O.none })),
      ),
    ),
    O.alt(() => storeQuickLinkOf(product.linkList)),
    O.alt(() =>
      pipe(
        urlOfTag('SourceLink', product.linkList),
        O.map((url): QuickLink => ({
          label: 'Source',
          url,
          firefoxUrl: O.none,
        })),
      ),
    ),
  )

export const productList: readonly Product[] = pipe(
  unorderedProductList,
  RA.filter((product) => product.isVisible),
  RA.sortBy([hasLogoFirstOrd, newestFirstOrd]),
)

// The categories with at least one visible product: a highlight with no card
// behind it is left out, and its URL reads as every product
export const shownCategoryList: readonly ProductCategory[] = pipe(
  productCategoryList,
  RA.filter((category) =>
    pipe(
      productList,
      RA.exists((product) => RA.elem(S.Eq)(category)(product.categoryList)),
    ),
  ),
)
