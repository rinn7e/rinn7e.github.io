import { type Cmd, Sub } from 'tea-cup-fp'

import { type NoOpMsg, cmdSucceed } from './cmd'

// Scroll
// ---------------------------------------------
//
// Each history entry keeps the scroll it was left at in its state
// (`scrollY`): saved by every push (`pushUrl`), which runs before React
// draws the step (see `urlWriterOf` in `src/util/url.ts`), so the page is
// still the one it leaves; read when the browser lands on the entry
// (`savedScrollOfEntry`, in `UrlChanged`). The step decides where the
// screen it shows is drawn (`Model.scroll`), and the app scrolls there
// after React has drawn that screen and before the browser paints it
// (`useScrollOf`).
//
// The browser restores the scroll of an entry too (its restoration stays
// `auto`), and the swipe back of Safari needs it: Safari shows its snapshot
// of the entry only when the browser restores the scroll (or the window is
// at the scroll of the snapshot), and with `manual` it drew a blank page
// under the finger. Both land on the same place, because the app draws the
// entry it lands on in the `popstate` event itself (`popStateSub`), before
// the browser restores the scroll, and a push runs while the page left is
// still drawn: Safari takes its snapshot of the entry left, and saves its
// scroll, when the new entry is added. The view never writes the history:
// a link only dispatches its move. `doc/swipe-back.md` says what Safari
// does on a swipe back, how to measure it, and why this site does not
// scroll in its own box as TEA Ecosystem does.

type ScrollState = { readonly scrollY: number }

const isScrollState = (state: unknown): state is ScrollState =>
  typeof state === 'object' &&
  state !== null &&
  'scrollY' in state &&
  typeof state.scrollY === 'number'

// The scroll of the page, kept in the history entry shown
const saveScrollOfEntry = (): void => {
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

// Adds `url` to the history as a new entry (no `popstate` fires for it),
// and the entry it leaves keeps the scroll of the page first. Called only
// by the URL writer of the program (`urlWriterOf`), before React draws the
// step, so the page and its scroll are still the ones the entry leaves.
export const pushUrl = (url: string): void => {
  saveScrollOfEntry()
  window.history.pushState(null, '', url)
}

// Changes the history entry shown to `url` (no `popstate` fires for it),
// and the entry keeps its saved scroll
export const replaceUrl = (url: string): void => {
  const state: unknown = window.history.state
  window.history.replaceState(state, '', url)
}

// `replaceUrl` as a command, for the correction of the URL at boot
export const replaceUrlCmd = (url: string): Cmd<NoOpMsg> =>
  cmdSucceed(() => {
    replaceUrl(url)
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
