import * as O from 'fp-ts/Option'
import { describe, expect, it } from 'vitest'

import { BOOT_ELEMENT_ID, bootOf, bootScriptOf } from '@/common/util/boot'

// A page that holds `text` in the element of the boot, or none
const pageWith = (text: string | null) => ({
  getElementById: (id: string) =>
    id === BOOT_ELEMENT_ID && text !== null ? { textContent: text } : null,
})

describe('the boot of a page rendered ahead of time', () => {
  it('is read back as it was written', () => {
    const script = bootScriptOf({ now: 1795000000000 })
    const json = script.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
    expect(bootOf(pageWith(json))).toEqual(O.some({ now: 1795000000000 }))
  })

  it('is none on a page rendered in the browser, or with a broken one', () => {
    expect(bootOf(pageWith(null))).toEqual(O.none)
    expect(bootOf(pageWith('not json'))).toEqual(O.none)
    expect(bootOf(pageWith('{"now":"soon"}'))).toEqual(O.none)
  })
})
