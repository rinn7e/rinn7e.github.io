# Code convention

The site is a small app on The Elm Architecture: React with `react-tea-cup`, `fp-ts`, Tailwind CSS v4 and Vite. These rules are the ones of my other `react-tea-cup` apps (the frontend of `rinn7e/realworld-fullstack-react-tea-cup-haskell` is the reference), cut down to what this site needs.

## Folders

```
src/root.tsx                   mounts the program
src/program.tsx                the ProgramWithNav, with withUrl around update
src/type.ts                    the root Model and Msg, the screen model
src/update.ts                  init (the boot) and the root update
src/view.tsx                   the root view: header, screen, footer
src/handler/                   the navigation (every move of the app)
src/util/                      destinationOf and the URL adapter
src/common/type/destination/   Destination, Screen, NavigationMsg, the URL parser
src/common/data/product.ts     the products shown
src/common/util/               commands for side effects
src/component/                 shared views: profile header, footer, link, icons, the debug panel
src/screen/<name>-screen/      one folder per screen
tests/                         mirrors src/
```

File and folder names are singular and in kebab-case. A screen with its own state has `type.ts` (`Model`, `Msg`, `Props`, `PropsEq`), `update.ts` (`init`, `update`), `component.tsx` (only the memo component is exported) and `index.ts`, which re-exports `type` and `update`, never `component`. A screen with no state (`about-screen`, `privacy-screen`, `not-found-screen`) is only a view helper.

## Views

1. A dumb view (no hooks, no state) is a camelCase view helper called inline: `headerView({ screen })`, `productCardView({ product })`.
2. PascalCase JSX only for memo components (`ProductsScreenMemo`, with its `PropsEq`) or components that need hooks (`Link`).
3. No emoji as icons: `lucide-react`, or the brand marks of `src/component/icon.tsx`.

## Navigation and the URL

The app owns where it is; the URL only follows.

1. A `Destination` is a `Screen` with its params (`ProductsScreen` with the `product` opened and the `category` filtered to, `AboutScreen`, `PrivacyScreen`). It is never stored: `destinationOf(model)` reads it from the screen model.
2. Every move is a `NavigationMsg` (`Navigate` from a click, `UrlChanged` from the browser back and forward), handled by `navigationMsgHandler`. Links in the app use `Link`, a real anchor that navigates in the app on a plain left click.
3. `parseDestination` and `toUrlString` are the only code that knows how the URL is spelled. URLs use full readable names (`/?product=damn-center`, `/about`, `/privacy`).
4. The URL is written after every step by `withUrl`, the one wrapper around the root `update`: a change of destination pushes an entry, the same destination writes nothing, and `UrlChanged` already has its entry. The boot replaces the URL when it was another spelling of its destination (`/about/`).
5. A param of a screen (the product opened) lives in the model of that screen only; opening or closing a product is a message of the screen, and the URL follows. The screenshot shown is not in the URL.

## Search engines

`src/common/seo.ts` holds what search engines and link previews read: the title and description of each page (`seoPageList`), the social card (`public/og.png`, 1200x630, a render of the top of the products page) and the structured data (schema.org JSON-LD: the person, the site and the products, built from `productList`). `index.html` has placeholders (`%SEO_TITLE%` and the like). In the dev server the plugin of `vite.config.ts` fills them in for the first page; in a build it writes a copy of the app for each page at its path (`about/index.html`, `privacy/index.html`, which GitHub Pages serves for `/about` and `/privacy`), a `404.html` copy with `noindex`, and `sitemap.xml`. `public/robots.txt` points to the sitemap. A new page goes into `seoPageList`, and the app sets the same title as it moves (`titleOf` in `src/handler/navigation-handler.ts`).

## The privacy page

The Privacy page (`/privacy`) lists every party that sees a visit and everything the site keeps in the browser. Today that is GitHub Pages, which serves the site, and Cloudflare Web Analytics (its beacon is added to the built pages by `cloudflareWebAnalytics` in `vite.config.ts`, with the token of the `rinn7e.com` site, set to "Enable with JS Snippet installation"), and nothing else: no cookies, no storage, no other asset from another host. A change of what Web Analytics collects, or a new tool turned on in the Cloudflare dashboard, changes the page too. It is only true while it matches the code and the hosting, so a commit that adds a request to another host, an asset from a CDN, an embed, an analytics tool or anything kept in the browser changes the page too.

## Debug panel

`src/component/debug-panel/` is a small panel in the bottom right corner for checking the site (turn every card over to its back, and back again). It shows only in development and on a local server (`IS_DEBUG_PANEL_ENABLED` in `src/common/env.ts`), never on `rinn7e.com`. Its asks to act on a screen are intercepted by the app root, which passes them to the screen.

## Owned values

`CurrentScreenModel` is a branded type (`src/common/type/brand-wrapper.ts`): only `currentScreenModelOfMove` (called by the navigation) and `sameScreenWith` (a screen changing its own model) make one, so the screen changes only by a move. Casts are forbidden by lint (`consistent-type-assertions`); the owner file is the one place with a cast, each with an `eslint-disable-next-line`.

## Code

1. Side effects (the URL, the scroll, the title) run only in a `Cmd` (`cmdSucceed`), never inside an `update`.
2. Use `fp-ts` with `pipe` (`A.map`, `A.filter`, `O.fold`) instead of methods on arrays and options; import modules by name (`fp-ts/Option`, not `fp-ts/lib/Option`).
3. Branch with a full `if` / `else if` / `else` tree, no early return; `switch` on `_tag` for unions. No `let`.
4. Prefer `satisfies` to `as`.

## Styling

1. Tailwind classes only, mobile first: unprefixed classes are the phone, `lg:` is the desktop. No `sm:`, `md:` or `max-*` breakpoints.
2. No margin classes: spacing is padding on the parent, or `gap`.
3. Explicit sizes in brackets, in `rem` (`px-[1rem]`, `gap-[1.5rem]`, `text-[0.875rem]`), so the whole page follows the root font size: 100% on a phone, 80% on a desktop (`src/asset/index.css`). Only hairlines stay in `px` (`border-[1px]`, the 1px grid gap).
4. Every hover and focus color has its `dark:` counterpart.
5. Every clickable element shows the hand cursor, and a disabled one `not-allowed`: one base rule in `src/asset/index.css` covers links, buttons, `[role='button']`, `summary`, `label[for]` and `select`; any other element that takes a click gets `cursor-pointer`.
6. The layout is a profile page: up to 1457px of content in 20px side padding, a 680px profile header (150px avatar, counts, bio, two buttons, highlights, tabs), then a grid of square cards, six a row at most. These sizes are at the full root size; a desktop draws them at 80%. The product opened shows in a popup over the page (closed by its button, Escape or a click on the backdrop; the page under it does not scroll), its slideshow across the whole popup with its card over the bottom right corner, and its text under it. Its card leaves the grid while it is open, and the grid keeps the room.
7. Motion animates only `opacity` and `transform`, plays once and stops under reduced motion. An animation the next step waits for (the card flying into the popup, the popup closing) is phases of the model (`OpenPhase`), with a `seq` that drops late messages; a one-off entrance nothing waits for (the cards fading in on the first screen a visitor sees; a switch of tab or category shows them at once) is a CSS animation in `src/asset/index.css`. The tilt and shine of a card under the pointer are presentation only, CSS variables set on the card.
8. Keep the GPU cost low: no `backdrop-filter` or blur, no large shadows, no looping animation. Plain borders and solid backgrounds.

## Tests

Tests live in `tests/`, in a tree that mirrors `src/`, and import through `@/`. A fixture builds the model with the real `init` (`bootOn` in `tests/helper/app.ts`).
