# Code convention

The site is a small app on The Elm Architecture: React with `react-tea-cup`, `fp-ts`, Tailwind CSS v4 and Vite. These rules are the ones of my other `react-tea-cup` apps (the frontend of `rinn7e/realworld-fullstack-react-tea-cup-haskell` is the reference), cut down to what this site needs.

## Folders

```
src/root.tsx                   hydrates the page rendered ahead of time, or mounts the program
src/prerender.tsx              renders every page to HTML at build time (see "Search engines")
src/share-card.tsx             the share image of every page, drawn at build time
src/program.tsx                the Program, with its URL writer (urlWriterOf) and popStateSub
src/type.ts                    the root Model and Msg, the screen model
src/update.ts                  init (the boot) and the root update
src/view.tsx                   the root view: backdrop, header, screen, footer
src/handler/                   the navigation (every move of the app)
src/util/                      destinationOf and the URL adapter
src/common/type/destination/   Destination, Screen, NavigationMsg, the URL parser
src/common/data/product.ts     the products shown
src/common/data/blog.ts        the blog posts, rendered by the build (`virtual:blog-post-list`)
src/common/util/               commands for side effects, small helpers
src/common/seo.ts              what search engines and link previews read
src/component/                 shared views: the profile header (a component with its own `Msg`,
                               no state: the app decides what Flip does),
                               the footer, the backdrop, link, icons, the debug panel
src/screen/<name>-screen/      one folder per screen
src/screen/products-screen/
  product-grid/                the grid of cards: its props and their Eq, the memo
  common/product-card/         the card, shared by the grid and the popup: the memo, its
                               front, its back, the pointer, its DOM ids
  product-popup/               the popup, a TEA component of the screen: its phases and
                               slideshow, its view split into the panel, the slideshow,
                               the links and the styles of each phase
src/screen/blog-screen/        the list of the posts
src/screen/blog-post-screen/   the page of a post, and the newer and older post under it
src/component/blog/            what the list and the page of a post share: the tags, the day
                               and the minutes to read
content/blog/                  the posts, one Markdown file each (see "The blog")
tool/                          what runs in Node, not in the browser: the import from dev.to
                               (`import-dev-to.ts`, run by `run.ts`) and the blog plugin of
                               the build (`blog/`)
tests/                         mirrors src/, and tool/ under tests/tool/
```

File and folder names are singular and in kebab-case. A screen with its own state has `type.ts` (`Model`, `Msg`, `Props`, `PropsEq`), `update.ts` (`init`, `update`), `component.tsx` (only the memo component is exported) and `index.ts`, which re-exports `type` and `update`, never `component`. Every screen has these files, also one with no state yet (`about-screen`, `privacy-screen`, `blog-screen`, `blog-post-screen`): its `Model` is empty and its `Msg` is a `NoOp`, so a feature on it starts from its own folder. Its `ScreenModel` variant carries the model, and the root `update` hands each screen message to the `update` of its screen. `not-found-screen` is the one screen kept as a lone `component.tsx`: a static message for any address the app does not know.

A part of a screen with state of its own is a TEA component under it, with the same files (`product-popup/`): it talks only to its parent, which opens it (`init`) and hands it its messages. The popup's `update` answers `none` once it has closed, and the screen then puts its card back in the grid.

## Views

1. A dumb view (no hooks, no state) is a camelCase view helper called inline: `slideshowView({ product, slideIndex, dispatch })`, `cardBackView({ product })`.
2. PascalCase JSX only for memo components (`ProductsScreenMemo`, with its `PropsEq`) or components that need hooks (`Link`).
3. Memo where a draw costs something, so a message of the app does not draw the whole page again: every screen but Not Found (a lone view helper), the profile header, the grid, the popup, each card, the footer and the backdrop are `XxxMemo` with a `PropsEq` (or a plain `memo` with no props, as the footer and the backdrop). A `PropsEq` leaves `dispatch` out, so the `dispatch` passed must send the same message whatever the model (the header asks `ToggleFlipAll`, and the app reads the side of the cards when the ask arrives).
4. Pass a memo component the value it draws from, not the raw input: the header gets its `HeaderScreen` (the tab, and with the cards their category and side), not the screen, so opening a product does not draw it again; the grid gets the category, the card away in the popup, the side of the cards and whether they are dealt, so a step of the popup's animation or a new screenshot does not draw the grid.
5. No emoji as icons: `lucide-react`, or the brand marks of `src/component/icon.tsx`.

## Navigation and the URL

The app owns where it is; the URL only follows. This is the architecture of every move of the app, and no change may break it, not even to work around a browser (the swipe back of Safari, a scroll restored too early):

- The URL is a thin wrapper around the destination: written only from it (`destinationOf`, read from the models), after a step, by the one URL writer (`urlWriterOf`, rule 4). Nothing else writes the URL or the history: no view, no handler, no `Cmd` of a screen.
- The URL is read only at boot and on the browser back and forward (`UrlChanged`), never to decide anything else.
- A link, a button or anything else that moves the app only dispatches its message (`Navigate`); the step decides where the app goes, and the URL follows it.
- Only `src/common/util/browser-history.ts` touches `window.history`; ESLint refuses it anywhere else (`no-restricted-properties` in `eslint.config.js`). A fix that seems to need the history elsewhere belongs in the URL writer instead, as the one for the swipe back did (`doc/swipe-back.md`).

1. A `Destination` is a `Screen` with its params (`ProductsScreen` with the `product` opened and the `category` filtered to, `BlogScreen`, `BlogPostScreen` with its `slug`, `AboutScreen`, `PrivacyScreen`). It is never stored: `destinationOf(model)` reads it from the screen model.
2. Every move is a `NavigationMsg` (`Navigate` from a click, `UrlChanged` from the browser back and forward), handled by `navigationMsgHandler`. Links in the app use `Link`, a real anchor that navigates in the app on a plain left click.
3. `parseDestination` and `toUrlString` are the only code that knows how the URL is spelled. URLs use full readable names (`/?product=damn-center`, `/blog`, `/blog/format-date-with-purescript`, `/about`, `/privacy`). A slug with no post reads as not found. The build writes a page per post at the same path (`blogPostPathOf` in `tool/blog/post-list.ts`), and a test holds the two spellings together.
4. The URL is a thin wrapper around the destination: written only from it, after every step, by the one URL writer of the program (`urlWriterOf` in `src/util/url.ts`, the `listener` of `Program`), and read only at boot and on the browser back and forward. A change of destination pushes an entry, the same destination writes nothing, and `UrlChanged` already has its entry (`urlWriteOf` decides, from the destinations before and after the step). The boot replaces the URL when it was another spelling of its destination (`/about/`). No view writes the URL or the history: a link only dispatches its `Navigate`. The writer is not a wrapper around `update`, and not a `Cmd`: the program calls its listener right after `update` and before React draws the step, while a `Cmd` runs only after the render, so a push runs while the page left is still drawn at its scroll (see "Scroll and the swipe back").
5. Every move sets where its screen is drawn (`Model.scroll`): a link move at the top, the back and forward of the browser at the scroll saved in its entry. How that scroll is kept, and how it differs from TEA Ecosystem, is the next section.
6. A param of a screen (the product opened) lives in the model of that screen only; opening or closing a product is a message of the screen, and the URL follows. The screenshot shown is not in the URL.

## Scroll and the swipe back

The page scrolls in the window (`window.scrollY`), as a reading page should: the toolbar of Safari on a phone shrinks as a post is read, and the whole page can be scrolled from anywhere. `src/common/util/browser-history.ts` holds the code, with a comment on each part. [`swipe-back.md`](swipe-back.md) says in full what Safari does on a back and a swipe back (from the source of WebKit), how to measure it with the log of WebKit, and what was tried before.

Each history entry keeps the scroll it was left at in its state (`{ scrollY }`): saved by every push (`pushUrl`, run by the URL writer before React draws the step, so the page is still the one left). The back and forward read it (`savedScrollOfEntry`, in `UrlChanged`), and `useScrollOf` in `src/view.tsx` scrolls to `Model.scroll` in a layout effect, after React has drawn the screen and before the browser paints it, so a page never shows at a wrong scroll first. The browser restores the scroll of an entry as well, and the two always agree, for the reasons below.

### Not as on TEA Ecosystem

TEA Ecosystem keeps the scroll of each entry the same way (its commit `310fd94`, which this site ported first), but it turns the restoration of the browser off (`history.scrollRestoration = 'manual'`) and scrolls the page inside its own box (its commit `45150fa`), so the window never scrolls. This site keeps the window scroll, and so does three things differently:

1. The restoration of the browser stays on (`auto`). WebKit shows its snapshot of the entry under the finger of a swipe back only when it restores the scroll itself, or when the scroll of the window is the same as when the snapshot was taken (step 2 in `swipe-back.md`). TEA Ecosystem meets the second rule (its window is always at 0). Here, with `manual`, a post at the top and a list scrolled down never met it, and Safari drew a blank page through the whole swipe.
2. The back and forward are drawn in the `popstate` event itself (`popStateSub`, given to `Program` in `src/program.tsx`), not by the subscription of `ProgramWithNav`, which dispatches in a later task. The browser restores the scroll right after the event, and Safari removes its snapshot once the first frame after the back is drawn and big enough (step 3 in `swipe-back.md`), so the screen of the entry must already be there: with the later task, Safari restored the scroll on the post being left, then took the snapshot down over a blank page, which stayed until the next touch (0.4 seconds or more with `manual`).
3. The URL writer pushes the new entry before React draws the step (`urlWriterOf`, the `listener` of `Program`, see rule 4 of "Navigation and the URL"), while the page is still at the scroll it leaves. The browser saves the scroll of the entry left, and Safari takes its snapshot of it, when the entry is added (step 1 in `swipe-back.md`). A push in a `Cmd` runs after the new screen has scrolled to the top, too late: the browser saved 0 and brought the list back at its top. A link itself only dispatches its `Navigate`: the view never writes the URL or the history.

So with this site in a window, the swipe back of Safari shows the list under the finger and lands on it at once, at its scroll. A page that moves to a scroll box, as TEA Ecosystem does, would not need points 2 and 3, but a post would lose the shrinking toolbar.

## Search engines

`src/common/seo.ts` holds what search engines and link previews read: the title, description, share image and kind of each page (`seoPageList`, and `blogPostSeoPageOf` for each post, an `article`) and the structured data (schema.org JSON-LD: the person, the site and the products, built from `productList`, and a `BlogPosting` on the page of a post). Every page is its own canonical URL, posts included. `index.html` has placeholders (`%SEO_TITLE%` and the like). In the dev server the plugin of `vite.config.ts` fills them in for the first page; in a build it writes a copy of the app for each page at its path (`about/index.html`, `blog/<slug>/index.html`, which GitHub Pages serves for `/about` and `/blog/<slug>`), a `404.html` copy with `noindex`, `sitemap.xml` of every page, and `feed.xml`, the RSS feed of the blog (`rssXml`: every post whole, its addresses made absolute), linked from the head of every page. `public/robots.txt` points to the sitemap. A new page goes into `seoPageList`, and the app sets the same title as it moves (`titleOf` in `src/handler/navigation-handler.ts`). `tests/common/seo.test.ts` holds every screen of the app to an entry there: a new screen fails its type check, then its test, until it has one.

Every page is rendered ahead of time, as on TEA Ecosystem. `pnpm run build` runs Vite twice: once for the browser (`dist/`), once with `--ssr` to compile `src/prerender.tsx` for Node (`dist-ssr/`, every package bundled in, `ssr.noExternal`, as fp-ts has no `exports` map). Then `tool/prerender.mjs` fills the root of each page with its HTML (`renderPage`, the root view of the model `init` gives) and the time it was rendered with (`src/common/util/boot.ts`), and draws the share image of each page (`src/share-card.tsx`, with satori and resvg: inline styles and flexbox only, so that one file does not use Tailwind; the R7 logo of `public/favicon.svg` heads every card). In the browser, `src/root.tsx` hydrates a page that holds its HTML (an address with a query, a product opened or a category, is drawn from nothing, as its HTML is the plain page), and the program boots with the time of the page (`initOnFirstRender`, a patch of react-tea-cup in `patches/`, the same as TEA Ecosystem), so the first render matches the HTML; the time of the browser follows (`SetNow`). So every view must render in Node: no `window` or `document` outside a `Cmd` or a handler, and anything that exists in the browser only (the debug panel) goes in `ClientOnly`.

## The blog

The posts are copies of the posts of `dev.to/rinn7e`, one Markdown file each in `content/blog/<slug>.md` (front matter, then the body as written on dev.to), written by `pnpm run blog:import` (`tool/import-dev-to.ts`). Their pictures are saved in `public/blog/<slug>/`, so no page loads anything from dev.to. The import repairs text that dev.to itself holds garbled (UTF-8 read as Windows-1252, `tool/blog/mojibake.ts`).

1. The build reads them, not the browser: the plugin of `tool/blog/plugin.ts` decodes each front matter with its io-ts codec (`tool/blog/front-matter.ts`, also used by the import), renders the Markdown with markdown-it and colors the code with the classes of highlight.js, guessing the language of a block that names none (`tool/blog/render.ts`), and serves the posts, newest first, as the module `virtual:blog-post-list`. A file that does not fit stops the build and names itself.
2. Raw HTML in the Markdown shows as text. A link to another post (its dev.to address) is rewritten to its page here and moves in the app (`bodyClickHandler` of the post screen); any other outside link opens in a new tab.
3. The body carries no classes, so it is the one place styled by a CSS block, `.blog-prose` in `src/asset/index.css` (with `@apply`, spaced by the gap of its column). Code looks as on TEA Ecosystem (its `codeBlockView`): one flat grey box with no border, long lines wrapped so it never scrolls sideways, in the GitHub colors of highlight.js for light and dark (`--hl-*`). The post sits on a solid card, so the backdrop of the page never shows behind its text.
4. `tool/` runs in Node. A script there runs through the module runner of Vite (`node tool/run.ts <script>`), as fp-ts has no `exports` map for plain Node.
5. Prettier leaves `content/` alone, so a post stays as written on dev.to.
6. A post reads on the centre axis, in the look of the site. The profile header shrinks to a slim one (`BlogPostHeader`: the photo, the name and the tabs), so the post starts near the top of the page. The post is one card: a mirrored row (All posts on the left edge, dev.to on the right), the day and the minutes to read (`readingMinutesOf`, 275 words a minute as dev.to counts), the title and the tags centred, the body left-aligned in a centred column, and the discussion (on dev.to) centred between two rules. Under it, the newer and the older post as two equal cards. On a phone the card is a band as wide as the screen, and the mirrored row is a bar that stays at the bottom of the screen while the post is read (sticky, so it stops above the footer). The list is a centred column of equal cards, the day and the minutes to read mirrored on their two edges.
7. A post of the last 30 days wears the badge New (`newBadgeView`): a small pill in the ink of the site, on the axis of its card (between the day and the minutes to read) and above the day of its page. The time is read once, at boot, by the program (`init(location, Date.now())`, so `init` stays pure), and the root model keeps the first day that still counts as new (`newSince`), which the blog screens get as a prop.

## The privacy page

The Privacy page (`/privacy`) lists every party that sees a visit and everything the site keeps in the browser. Today that is GitHub Pages, which serves the site, and Cloudflare Web Analytics (its beacon is added to the built pages by `cloudflareWebAnalytics` in `vite.config.ts`, with the token of the `rinn7e.com` site, set to "Enable with JS Snippet installation"), and the player of YouTube (`youtube-nocookie.com`), loaded only once a visitor presses play on the video of a product (`src/screen/products-screen/product-popup/slideshow.tsx`), and nothing else: no cookies of the site, no storage, no other asset from another host. A change of what Web Analytics collects, or a new tool turned on in the Cloudflare dashboard, changes the page too. It is only true while it matches the code and the hosting, so a commit that adds a request to another host, an asset from a CDN, an embed, an analytics tool or anything kept in the browser changes the page too.

## Debug panel

`src/component/debug-panel/` is a small panel in the bottom right corner for checking the site (turn every card over to its back, and back again). It shows only in development and on a local server (`IS_DEBUG_PANEL_ENABLED` in `src/common/env.ts`), never on `rinn7e.com`. Its asks to act on a screen are intercepted by the app root, which passes them to the screen.

## Owned values

`CurrentScreenModel` is a branded type (`src/common/type/brand-wrapper.ts`): only `currentScreenModelOfMove` (called by the navigation) and `sameScreenWith` (a screen changing its own model) make one, so the screen changes only by a move. Casts are forbidden by lint (`consistent-type-assertions`); the owner file is the one place with a cast, each with an `eslint-disable-next-line`.

## Code

1. Side effects (the URL, the title) run only in a `Cmd` (`cmdSucceed`), never inside an `update`. Two exceptions draw in an effect of a view: the scroll of a move (`update` only says where, `Model.scroll`, and a layout effect of the root view scrolls there, as a `Cmd` runs too late, after the paint), and the backdrop of the page, drawn on a canvas by its own component (`src/component/page-backdrop.tsx`), never as text in the page: as text, Safari Reader took its rows for the article.
2. Use `fp-ts` with `pipe` (`A.map`, `A.filter`, `O.fold`) instead of methods on arrays and options; import modules by name (`fp-ts/Option`, not `fp-ts/lib/Option`).
3. Branch with a full `if` / `else if` / `else` tree, no early return; `switch` on `_tag` for unions. No `let`.
4. Prefer `satisfies` to `as`.

## Styling

1. Tailwind classes only (but the body of a blog post, see "The blog"), mobile first: unprefixed classes are the phone, `lg:` is the desktop. No `sm:`, `md:` or `max-*` breakpoints.
2. No margin classes: spacing is padding on the parent, or `gap`.
3. Explicit sizes in brackets, in `rem` (`px-[1rem]`, `gap-[1.5rem]`, `text-[0.875rem]`), so the whole page follows the root font size: 100% on a phone, 80% on a desktop (`src/asset/index.css`). Only hairlines stay in `px` (`border-[1px]`, the 1px grid gap).
4. Every hover and focus color has its `dark:` counterpart.
5. Every clickable element shows the hand cursor, and a disabled one `not-allowed`: one base rule in `src/asset/index.css` covers links, buttons, `[role='button']`, `summary`, `label[for]` and `select`; any other element that takes a click gets `cursor-pointer`.
6. The tabs have one width each: `12rem` on a desktop (the longest label, Open-source work), `5.25rem` on a phone, where the products tab is named Work so the three leave room for Flip and Clear filter at the ends.
7. The layout is a profile page: up to 1457px of content in 20px side padding, a 680px profile header (150px avatar, counts, two buttons, highlights, tabs), then a grid of portrait playing cards, six a row at most. These sizes are at the full root size; a desktop draws them at 80%. The product opened shows in a popup over the page (closed by its button, Escape, a click on its card or a click on the backdrop; the page under it does not scroll), its slideshow across the whole popup with its card over the bottom right corner, and its text under it. Its card leaves the grid while it is open, and the grid keeps the room.
8. Motion animates only `opacity` and `transform`, plays once and stops under reduced motion. An animation the next step waits for (the card flying into the popup, the popup closing) is phases of the model (`OpenPhase` of `product-popup/type.ts`), with a `seq` per open that drops late messages of an earlier popup, and each phase taking only the messages of its own step; a one-off entrance nothing waits for (the cards fading in on the first screen a visitor sees; a switch of tab or category shows them at once) is a CSS animation in `src/asset/index.css`. The tilt and shine of a card under the pointer are presentation only, CSS variables set on the card.
9. Keep the GPU cost low: no `backdrop-filter` or blur, no large shadows, no looping animation. Plain borders and solid backgrounds.
10. The scrollbar of the page is always shown (`overflow-y: scroll` on `html`, with `scrollbar-gutter: stable` so a popup that locks the page keeps its room), so a short page sits on the same axis as a long one, as on TEA Ecosystem; it is drawn slim in the colors of the site.

## Tests

Tests live in `tests/`, in a tree that mirrors `src/`, and import through `@/`. A fixture builds the model with the real `init` (`bootOn` in `tests/helper/app.ts`).
