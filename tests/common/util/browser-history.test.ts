import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  pushEntryOfLink,
  pushUrlCmd,
  savedScrollOfEntry,
} from '@/common/util/browser-history'

// A fake browser at the edge: a history of entries (URL and state), the
// entry shown and the scroll of the page
type Entry = { url: string; state: unknown }

const browserAt = (url: string, scrollY: number) => {
  const entries: Array<Entry> = [{ url, state: null }]
  let index = 0
  const shown = (): Entry => entries[index] ?? { url, state: null }
  const fake = {
    scrollY,
    entries,
    location: {
      get pathname() {
        return new URL(shown().url, 'https://rinn7e.com').pathname
      },
      get search() {
        return new URL(shown().url, 'https://rinn7e.com').search
      },
    },
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

const run = (cmd: ReturnType<typeof pushUrlCmd>) => {
  cmd.execute(() => {})
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a move by a link', () => {
  it('adds its entry at the click, the entry left keeping its scroll', () => {
    const browser = browserAt('/blog', 1500)
    pushEntryOfLink('/blog/format-date')
    expect(browser.entries).toEqual([
      { url: '/blog', state: { scrollY: 1500 } },
      { url: '/blog/format-date', state: null },
    ])
    browser.history.back()
    expect(savedScrollOfEntry()).toBe(1500)
  })

  it('adds no entry for the page shown', () => {
    const browser = browserAt('/blog', 300)
    pushEntryOfLink('/blog')
    expect(browser.entries).toEqual([{ url: '/blog', state: { scrollY: 300 } }])
  })

  it('leaves nothing for the push of its step to add', () => {
    const browser = browserAt('/blog', 1500)
    pushEntryOfLink('/about')
    browser.scrollY = 0
    run(pushUrlCmd('/about', false))
    expect(browser.entries.map((entry) => entry.url)).toEqual([
      '/blog',
      '/about',
    ])
  })
})

describe('a push that does not move the page', () => {
  it('adds its entry, the entry left keeping its scroll', () => {
    const browser = browserAt('/', 900)
    run(pushUrlCmd('/?product=tea-ecosystem', true))
    expect(browser.entries).toEqual([
      { url: '/', state: { scrollY: 900 } },
      { url: '/?product=tea-ecosystem', state: null },
    ])
  })
})
