import { describe, expect, it } from 'vitest'

import { repairMojibake } from '../../../tool/blog/mojibake'

describe('text saved as UTF-8 and read as Windows-1252', () => {
  it('gets the lines of a folder tree back', () => {
    expect(
      repairMojibake('elm-google-map\nâ”œâ”€â”€ src\nâ”‚   â””â”€â”€ Main.elm'),
    ).toBe('elm-google-map\n├── src\n│   └── Main.elm')
  })

  it('gets accented letters and typographic quotes back', () => {
    expect(repairMojibake('cafÃ© â€œhiâ€\u009d')).toBe('café “hi”')
  })

  it('leaves text that was never garbled as it is', () => {
    const text = 'Café, naïve, — and ├── are fine.'
    expect(repairMojibake(text)).toBe(text)
  })
})
