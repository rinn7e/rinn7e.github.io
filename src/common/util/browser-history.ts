import { type Cmd, Sub } from 'tea-cup-fp'

import { type NoOpMsg, cmdSucceed } from './cmd'

// Scroll
// ---------------------------------------------
//
// Each history entry keeps the scroll it was left at in its state
// (`scrollY`): saved by a link move at the click (`pushEntryOfLink`), or by
// a push that does not move the page (a product opened or closed, a
// category), and read when the browser lands on it (`savedScrollOfEntry`,
// in `UrlChanged`). The step decides where the screen it shows is drawn
// (`Model.scroll`), and the app scrolls there after React has drawn that
// screen and before the browser paints it (`useScrollOf`).
//
// The browser restores the scroll of an entry too (its restoration stays
// `auto`), and the swipe back of Safari needs it: Safari shows its snapshot
// of the entry only when the browser restores the scroll (or the window is
// at the scroll of the snapshot), and with `manual` it drew a blank page
// under the finger. Both land on the same place, because the app draws the
// entry it lands on in the `popstate` event itself (`popStateSub`), before
// the browser restores the scroll, and a link move adds its entry before it
// draws the new screen, while the page is still at the scroll it leaves
// (`pushEntryOfLink`): Safari takes its snapshot of the entry left, and
// saves its scroll, when the new entry is added. `doc/swipe-back.md` says
// what Safari does on a swipe back, how to measure it, and why this site
// does not scroll in its own box as TEA Ecosystem does.

type ScrollState = { readonly scrollY: number }

const isScrollState = (state: unknown): state is ScrollState =>
  typeof state === 'object' &&
  state !== null &&
  'scrollY' in state &&
  typeof state.scrollY === 'number'

// The scroll of the page, kept in the history entry shown
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

// URL writes
// ---------------------------------------------

// The URL of the page, with its query
const currentUrl = (): string =>
  window.location.pathname + window.location.search

// A move by a link, at the click and before the move is dispatched: the
// entry it leaves keeps the scroll of the page, and the entry of `url` is
// added while the page is still there, so the browser keeps that scroll
// and its snapshot for the entry left (see "Scroll" above). The push of the
// step (`pushUrlCmd`) then finds the URL already there. A link to the page
// shown adds no entry.
export const pushEntryOfLink = (url: string): void => {
  saveScrollOfEntry()
  if (url !== currentUrl()) {
    window.history.pushState(null, '', url)
  }
}

// Adds `url` to the history as a new entry (no `popstate` fires for it),
// unless the browser shows it already (a link added it at the click). With
// `saveScroll`, the entry it leaves first keeps the scroll of the page: for
// a push that does not move the page (a product opened or closed, a
// category).
export const pushUrlCmd = (url: string, saveScroll: boolean): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    if (url === currentUrl()) {
      return
    }
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

// Back and forward
// ---------------------------------------------

// The browser's back and forward, drawn in the `popstate` event itself, so
// the screen of the entry is there when the browser restores its scroll
// right after the event. The subscription of `ProgramWithNav` dispatches in
// a later task: the browser restored the scroll on the screen being left,
// and Safari, back from a swipe, kept a blank page until the next touch.
class PopStateSub<Msg> extends Sub<Msg> {
  private readonly listener = (): void => {
    this.dispatch(this.toMsg(window.location), true)
  }

  constructor(private readonly toMsg: (location: Location) => Msg) {
    super()
  }

  protected override onInit(): void {
    super.onInit()
    window.addEventListener('popstate', this.listener)
  }

  protected override onRelease(): void {
    super.onRelease()
    window.removeEventListener('popstate', this.listener)
  }
}

export const popStateSub = <Msg>(
  toMsg: (location: Location) => Msg,
): Sub<Msg> => new PopStateSub(toMsg)
