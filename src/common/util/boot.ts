import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

// The time a page was rendered with ahead of time (`src/prerender.tsx`),
// written into its HTML, as on TEA Ecosystem. The first render in the
// browser takes it too, so it draws the very page the HTML holds (the badge
// New of a post depends on the day) and React hydrates it instead of
// drawing it again; the real time follows right after (`program.tsx`).
export type Boot = { readonly now: number }

export const BootJson: t.Type<Boot> = t.type({ now: t.number })

export const BOOT_ELEMENT_ID = 'boot'

// The script element that holds it, in a page rendered ahead of time
export const bootScriptOf = (boot: Boot): string =>
  `<script type="application/json" id="${BOOT_ELEMENT_ID}">${JSON.stringify(boot)}</script>`

// The part of the page it reads: `document` in the browser
export type BootSource = {
  readonly getElementById: (
    id: string,
  ) => { readonly textContent: string | null } | null
}

// None on a page that was not rendered ahead of time (the dev server,
// `404.html`)
export const bootOf = (doc: BootSource): O.Option<Boot> =>
  pipe(
    O.fromNullable(doc.getElementById(BOOT_ELEMENT_ID)?.textContent),
    O.chain((text) => O.tryCatch((): unknown => JSON.parse(text))),
    O.chain((json) =>
      O.fromEither(
        pipe(
          BootJson.decode(json),
          E.mapLeft(() => undefined),
        ),
      ),
    ),
  )
