import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  pushUrl,
  replaceUrl,
  savedScrollOfEntry,
} from '@/common/util/browser-history'

import { browserAt } from '../../helper/browser'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a push', () => {
  it('adds its entry, the entry left keeping the scroll of the page', () => {
    const browser = browserAt('/blog', 1500)
    pushUrl('/blog/format-date')
    expect(browser.entries).toEqual([
      { url: '/blog', state: { scrollY: 1500 } },
      { url: '/blog/format-date', state: null },
    ])
    browser.history.back()
    expect(savedScrollOfEntry()).toBe(1500)
  })
})

describe('a replace', () => {
  it('changes the URL of the entry shown, which keeps its saved scroll', () => {
    const browser = browserAt('/', 900)
    pushUrl('/about/')
    browser.history.back()
    replaceUrl('/')
    expect(browser.entries[0]).toEqual({ url: '/', state: { scrollY: 900 } })
  })
})

describe('an entry never left', () => {
  it('has no saved scroll', () => {
    browserAt('/blog', 700)
    expect(savedScrollOfEntry()).toBe(0)
  })
})
