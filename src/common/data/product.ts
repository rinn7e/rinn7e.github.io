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

export type Product = {
  readonly id: string
  readonly name: string
  // A short label of what it is, shown under the name
  readonly kind: string
  readonly description: string
  readonly categoryList: readonly ProductCategory[]
  // A screenshot in `public/shot/`, shown whole inside a 16:10 frame
  readonly image: string
  readonly imageAlt: string
  // Pixel art keeps its hard edges when scaled
  readonly isPixelArt: boolean
  readonly linkList: readonly ProductLink[]
}

const sourceLink = (repository: string): ProductLink => ({
  _tag: 'SourceLink',
  url: `https://github.com/rinn7e/${repository}`,
})

export const productList: readonly Product[] = [
  {
    id: 'damn-center',
    name: 'Damn Center',
    kind: 'Browser extension',
    description:
      'Center any website on a widescreen or ultrawide monitor, with per-site padding, rulers, themes and patterns.',
    categoryList: ['BrowserExtension'],
    image: 'shot/damn-center.webp',
    imageAlt:
      'The Damn Center popup next to a website centered on a wide screen',
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
    name: 'Claude Desktop Theme Tuner',
    kind: 'Web app and plugin',
    description:
      'Pick, tune and copy a color theme for the Claude desktop app, with a live preview in light and dark mode.',
    categoryList: ['WebApp', 'DeveloperTool'],
    image: 'shot/theme-tuner.webp',
    imageAlt:
      'The theme tuner with its presets and knobs, and a live preview of the app in both modes',
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
    name: 'TEA Ecosystem',
    kind: 'Website',
    description:
      'A catalog of The Elm Architecture in every language and framework, each one graded against Elm.',
    categoryList: ['WebApp'],
    image: 'shot/tea-ecosystem.webp',
    imageAlt: 'The TEA Ecosystem catalog with its language icons and entries',
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
    name: 'RealWorld Conduit',
    kind: 'Full-stack app',
    description:
      'A type-safe RealWorld app: a Haskell Servant backend, React frontends on react-tea-cup and an admin dashboard.',
    categoryList: ['WebApp'],
    image: 'shot/conduit.webp',
    imageAlt: 'The Conduit home page with its global feed and popular tags',
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
    name: 'Ninja Adventure',
    kind: 'Browser game',
    description:
      'Ninja Adventure rewritten in Scala 3 with the Indigo engine, to show how a real game works in TEA style.',
    categoryList: ['Game'],
    image: 'shot/ninja.webp',
    imageAlt: 'The village of Ninja Adventure, with the player and followers',
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
    name: 'Indigo Game Starter',
    kind: 'Game template',
    description:
      'A starter template for Indigo games in Scala 3, shaped like a TEA app, with Slime Quest, a small RPG, to build on.',
    categoryList: ['Game', 'DeveloperTool'],
    image: 'shot/slime-quest.webp',
    imageAlt: 'The world map of Slime Quest, with a quest to talk to the elder',
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
    name: 'Image Overlay',
    kind: 'macOS command line tool',
    description:
      'Float a semi-transparent image over every window, to line up a design with the page you built.',
    categoryList: ['DeveloperTool'],
    image: 'shot/image-overlay.webp',
    imageAlt:
      'A design floating at half opacity over a page in the browser, started from the terminal',
    isPixelArt: false,
    linkList: [sourceLink('image-overlay')],
  },
  {
    id: 'universal-theme-tuner',
    name: 'Universal Theme Tuner',
    kind: 'Themes and extension',
    description:
      'Solarized themes for VS Code with a live tuning panel, and Solarize, an extension that recolors websites.',
    categoryList: ['DeveloperTool', 'BrowserExtension'],
    image: 'shot/universal-theme-tuner.webp',
    imageAlt:
      'The VS Code Theme Tuner panel with the surface, text and syntax colors',
    isPixelArt: false,
    linkList: [sourceLink('universal-theme-tuner')],
  },
]
