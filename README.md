# rinn7e.github.io

The personal website at [rinn7e.com](https://rinn7e.com/). Screen 1 is a face as colour ASCII art that breathes, blinks and turns its eyes red; screen 2 shows the links.

## Layout

```
apps/web/              the website: React with react-tea-cup (the Elm Architecture), Vite, Tailwind v4
  src/portrait/        the ASCII portrait, its drawn animation frames and the switch to screen 2
packages/codec/        io-ts helpers: readable decode errors
packages/design-tokens/ colours and fonts as CSS variables
doc/code-convention.md how the code is written, including the frame by frame animation rule
```

The animation frames in `apps/web/src/portrait` are drawn ahead of time by the design tools of the portrait.

## Requirements

Node 24 or newer and pnpm 11.

## Commands

Run from the repo root:

| Command                            | What it does                          |
| ---------------------------------- | ------------------------------------- |
| `pnpm install`                     | installs every workspace package      |
| `pnpm dev`                         | starts the website dev server         |
| `pnpm run build`                   | builds the website into apps/web/dist |
| `pnpm run check`                   | type checks every package             |
| `pnpm run lint`                    | ESLint over the repo                  |
| `pnpm run format` / `format:check` | Prettier                              |
| `pnpm test`                        | Vitest in every package               |

The debug controls (frame rate, pause, blink, red eye and its style) show in the dev build only.

## Deploy

GitHub Pages serves the website at [rinn7e.com](https://rinn7e.com/). `.github/workflows/deploy.yml` checks every push and pull request (format, lint, types, tests, build) and deploys every push to `master`. The custom domain is set in the repository's Pages settings, with "GitHub Actions" as the source.

The old Elm site that lived in this repository is kept in the branch `archive/elm-site` and the tag `elm-site-final`.
