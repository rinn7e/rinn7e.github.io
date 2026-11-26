import { type Cmd } from 'tea-cup-fp'

import { type NoOpMsg, cmdSucceed } from './cmd'

// Scroll
// ---------------------------------------------
//
// The app restores the scroll of a history entry itself, as TEA Ecosystem
// does: the browser does it when the traversal lands, before the screen of
// that entry is drawn, so a long page came back clamped to the height of
// the short one it replaced, and the swipe back of Safari showed a page
// that did not scroll at once. Each entry keeps its own `scrollY` in its
// state: saved by `Link` at the click (`saveScrollOfEntry`), or by a push
// that does not move the page (a product opened or closed, a category),
// and read when the browser lands on it (`savedScrollOfEntry`, in
// `UrlChanged`). The step decides where the screen it shows is drawn
// (`Model.scroll`), and the app scrolls there after React has drawn that
// screen and before the browser paints it (`useScrollOf`), so the first
// frame of a page is already at its place.

type ScrollState = { readonly scrollY: number }

const isScrollState = (state: unknown): state is ScrollState =>
  typeof state === 'object' &&
  state !== null &&
  'scrollY' in state &&
  typeof state.scrollY === 'number'

// The scroll of the page, kept in the history entry shown. Called by `Link`
// at the click, before the move is dispatched: the move then draws its
// screen at the top, before the push runs.
export const saveScrollOfEntry = (): void => {
  const state: ScrollState = { scrollY: window.scrollY }
  window.history.replaceState(state, '')
}

// The scroll saved in the history entry shown, 0 when it has none (an entry
// opened from its URL and never left)
export const savedScrollOfEntry = (): number => {
  const state: unknown = window.history.state
  return isScrollState(state) ? state.scrollY : 0
}

// Once at boot: the app restores the scroll itself
export const manualScrollRestorationCmd = (): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    window.history.scrollRestoration = 'manual'
  })

// URL writes
// ---------------------------------------------

// Adds `url` to the history as a new entry (no `popstate` fires for it).
// With `saveScroll`, the entry it leaves first keeps the scroll of the
// page: for a push that does not move the page (a product opened or
// closed, a category). A move by a link saved it at the click already, and
// has scrolled to its top by the time the push runs.
export const pushUrlCmd = (url: string, saveScroll: boolean): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    if (saveScroll) {
      saveScrollOfEntry()
    }
    window.history.pushState(null, '', url)
  })

// Changes the history entry shown to `url` (no `popstate` fires for it),
// and the entry keeps its saved scroll
export const replaceUrlCmd = (url: string): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    const state: unknown = window.history.state
    window.history.replaceState(state, '', url)
  })
