import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'

// Text that was saved as UTF-8 and read back as Windows-1252 (mojibake):
// `├──` of a folder tree shows as `â”œâ”€â”€`. An old post of dev.to holds it
// in its own source, so the import repairs it (`tool/import-dev-to.ts`).

// The bytes 0x80 to 0x9F of Windows-1252, which are not the code points of
// the same number (the other bytes above 0x7F are)
const windows1252ByteMap: ReadonlyMap<string, number> = new Map([
  ['€', 0x80],
  ['‚', 0x82],
  ['ƒ', 0x83],
  ['„', 0x84],
  ['…', 0x85],
  ['†', 0x86],
  ['‡', 0x87],
  ['ˆ', 0x88],
  ['‰', 0x89],
  ['Š', 0x8a],
  ['‹', 0x8b],
  ['Œ', 0x8c],
  ['Ž', 0x8e],
  ['‘', 0x91],
  ['’', 0x92],
  ['“', 0x93],
  ['”', 0x94],
  ['•', 0x95],
  ['–', 0x96],
  ['—', 0x97],
  ['˜', 0x98],
  ['™', 0x99],
  ['š', 0x9a],
  ['›', 0x9b],
  ['œ', 0x9c],
  ['ž', 0x9e],
  ['Ÿ', 0x9f],
])

const byteOf = (char: string): number | undefined => {
  const code = char.codePointAt(0) ?? 0
  return windows1252ByteMap.get(char) ?? (code <= 0xff ? code : undefined)
}

// The lead byte of a UTF-8 character of two, three or four bytes, read as
// Windows-1252, then its continuation bytes
const mojibakePattern =
  /[Â-ß][^\x00-\x7f]|[à-ï][^\x00-\x7f]{2}|[ð-ô][^\x00-\x7f]{3}/g

const utf8 = new TextDecoder('utf-8', { fatal: true })

const isContinuationByte = (byte: number): boolean =>
  byte >= 0x80 && byte <= 0xbf

// One match back to the character it was, or as it is when its bytes are
// not one UTF-8 character (then it was real text, such as `é` before `…`)
const repairOne = (match: string): string =>
  pipe(
    [...match],
    RA.traverse(O.Applicative)((char) => O.fromNullable(byteOf(char))),
    O.filter((byteList) =>
      pipe(byteList, RA.dropLeft(1), RA.every(isContinuationByte)),
    ),
    O.chain((byteList) =>
      O.tryCatch(() => utf8.decode(new Uint8Array(byteList))),
    ),
    O.getOrElse(() => match),
  )

export const repairMojibake = (text: string): string =>
  text.replace(mojibakePattern, repairOne)
