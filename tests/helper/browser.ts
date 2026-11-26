import { vi } from 'vitest'

// A fake browser at the edge: a history of entries (URL and state), the
// entry shown and the scroll of the page. Stubs `window` until
// `vi.unstubAllGlobals()`.
export type Entry = { url: string; state: unknown }

export const browserAt = (url: string, scrollY: number) => {
  const entries: Array<Entry> = [{ url, state: null }]
  let index = 0
  const shown = (): Entry => entries[index] ?? { url, state: null }
  const fake = {
    scrollY,
    entries,
    history: {
      get state() {
        return shown().state
      },
      replaceState: (state: unknown, _title: string, next?: string) => {
        entries[index] = { url: next ?? shown().url, state }
      },
      pushState: (state: unknown, _title: string, next: string) => {
        entries.splice(index + 1)
        entries.push({ url: next, state })
        index = entries.length - 1
      },
      back: () => {
        index = index - 1
      },
    },
  }
  vi.stubGlobal('window', fake)
  return fake
}
