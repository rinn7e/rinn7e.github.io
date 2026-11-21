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
src/component/                 shared views: header, footer, link, icons
src/screen/<name>-screen/      one folder per screen
tests/                         mirrors src/
```

File and folder names are singular and in kebab-case. A screen with its own state has `type.ts` (`Model`, `Msg`, `Props`, `PropsEq`), `update.ts` (`init`, `update`), `component.tsx` (only the memo component is exported) and `index.ts`, which re-exports `type` and `update`, never `component`. A screen with no state (`about-screen`, `not-found-screen`) is only a view helper.

## Views

1. A dumb view (no hooks, no state) is a camelCase view helper called inline: `headerView({ screen })`, `productCardView({ product })`.
2. PascalCase JSX only for memo components (`ProductsScreenMemo`, with its `PropsEq`) or components that need hooks (`Link`).
3. No emoji as icons: `lucide-react`, or the brand marks of `src/component/icon.tsx`.

## Navigation and the URL

The app owns where it is; the URL only follows.

1. A `Destination` is a `Screen` with its params (`ProductsScreen` with its `category`, `AboutScreen`). It is never stored: `destinationOf(model)` reads it from the screen model.
2. Every move is a `NavigationMsg` (`Navigate` from a click, `UrlChanged` from the browser back and forward), handled by `navigationMsgHandler`. Links in the app use `Link`, a real anchor that navigates in the app on a plain left click.
3. `parseDestination` and `toUrlString` are the only code that knows how the URL is spelled. URLs use full readable names (`/?category=developer-tools`, `/about`).
4. The URL is written after every step by `withUrl`, the one wrapper around the root `update`: a change of destination pushes an entry, the same destination writes nothing, and `UrlChanged` already has its entry. The boot replaces the URL when it was another spelling of its destination (`/about/`).
5. A param of a screen (the category) lives in the model of that screen only; picking it is a message of the screen, and the URL follows.

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
3. Explicit sizes in brackets (`px-[16px]`, `gap-[24px]`), font sizes in `rem` (`text-[0.875rem]`).
4. Every hover and focus color has its `dark:` counterpart.
5. The layout is mirror-symmetric around the centre axis: the header is a `1fr auto 1fr` grid with the logo in the middle, headings and rows of chips and cards are centred, and an incomplete last row of cards is centred too. Long text stays left-aligned inside a centred column.
6. Keep the GPU cost low: no `backdrop-filter` or blur, no large shadows, no looping animation. Plain borders and solid backgrounds.

## Tests

Tests live in `tests/`, in a tree that mirrors `src/`, and import through `@/`. A fixture builds the model with the real `init` (`bootOn` in `tests/helper/app.ts`).
