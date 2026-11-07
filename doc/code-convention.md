# Code convention

## Architecture

- Apps follow the Elm Architecture with `react-tea-cup` and `tea-cup-fp`: one `Model` (`src/type.ts`), changed only through `Msg` messages in `src/update.ts`.
- State changes go through small, pure sub-updaters (`handleToggleTheme`, `handleScreen2`, ...) that return a new model; side effects (keeping a choice in storage) are commands.

## Views

- View functions (plain functions returning JSX, not components) end with `View`: `themeButtonView`, `linkView`, `closeButtonView`.
- A small component is fine where a view needs local state the model should not hold.

## Styling

- Tailwind v4. Shared colors and fonts are tokens in `packages/design-tokens/tokens.css` (`bg-page`, `text-ink`, ...), with dark values under the `.dark` class on `<html>`. An app sets that class from the choice of the visitor, else from the OS setting, and maps the Tailwind `dark:` variant to it with `@custom-variant dark (&:where(.dark, .dark *));` (see `apps/web/src/theme.ts`). An app adds its own tokens in its `src/asset/index.css`.
- Font sizes use `rem` (Tailwind `text-xs` or `text-[0.75rem]`), never `px`, and nothing smaller than `text-[0.625rem]`.
- No margin utilities (`m-`, `mt-`, `mx-`, ...): space elements with the padding or `gap-` of the parent.

## Animation

Every animation of the ASCII art is drawn frame by frame, like a 2D sprite. Do not fake motion by changing colours, swapping cells or sliding characters with CSS: the characters themselves must move to new places, as in a drawing.

To add an animation:

1. Write a tool among the design tools of the portrait that changes the source images for each frame (bend, slide, close), the gray image the grid is made from and the colour photo alike. `tools/hair-frames.mjs` (the hair in the wind) and `tools/eye-frames.mjs` (the spinning red eye and the blink, two motions combined: every turn of the spin is drawn with every lid position) are the examples.
2. Make each changed gray image into ASCII with `tools/ascii.mjs`, with the same settings as the still grid, and keep only the band of rows that moves.
3. Save the frames as one text file (the band of every frame, one after the other) and one JPEG sprite sheet of their colours (one frame below the other, two pixels per character), for the light and the dark mode. Add the step to `tools/prepare.sh`.
4. In the app, load them with `framesOf` in `apps/web/src/portrait/portrait.ts`, give the band its place in `PortraitArt`, and pick the frame from the time of the frame clock with a pure function in `animate.ts` (like `hairFrameAt` and `blinkFrameAt`), so the frame rate slider and the pause button apply to it.
5. Keep the outline of the face still, and fade the motion out toward the edges of the band, so it meets the still rows without a seam. Test that every frame has every row and column (`test/portrait.test.ts`).

A frame rate up to 30 fps is enough: the frames are few, and the slider stops at 30.

The one exception is the breathing: it moves the whole portrait up and down by 2px and changes nothing in the drawing, so it is a transform.

The controls around the art (the buttons in the corner) are not part of the drawing. They animate smoothly at the screen rate with `requestAnimationFrame`, changing only a `transform` on an element with its own layer (`will-change: transform`), so a frame paints nothing; no CSS keyframe animations. A control that appears or goes once (the arrow and close buttons popping in and out) may use a CSS transition of its `scale` and `opacity` only, which the browser runs without painting (or `rotate`, as the square behind the name on screen 2 turns at each switch). A small outline drawn on hover (the name on screen 2) may transition the `stroke-dashoffset` of its SVG: it repaints only that small square, and only while it draws. The frame rate slider and the pause button do not apply to them.

## Data

- Anything read from outside the code (storage, the network) is decoded with an `io-ts` codec; invalid data is treated as missing instead of crashing.
- Decode errors go through `decodeWith` from `@portfolio/codec`, which turns them into readable lines like `title: expected string, got 3`.
- Import fp-ts and io-ts modules by name (`fp-ts/Either`), never from `fp-ts/lib/*`; ESLint enforces it.

## Tests

- Vitest, in the `test/` folder of each package. New or changed sub-updaters, codecs and pure animation functions need tests.
