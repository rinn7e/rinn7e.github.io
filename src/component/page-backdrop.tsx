import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import { memo } from 'react'

// The backdrop of every page: the word rinn7e in bold italic rows on a
// diagonal, as on the back of a card and at the same size (the card back
// draws its word at 11% of the width of a 174px card), but in a gray so
// light it is almost not there. A fixed layer behind the content: it stays
// put while the page scrolls, and draws once, with no animation. The rows
// sit in a square of 150vmax turned around the centre of the window, which
// covers the window at any size once turned. A memo with no props: its
// 210 rows are drawn once, never again on a message of the app.

const FONT_SIZE_PX = 19
const ROW_TEXT = pipe(RA.replicate(70, 'rinn7e'), RA.intercalate(S.Monoid)(' '))

// Enough rows to fill the square on a large screen (150vmax of a 2560px
// window is 3840px)
const rowList: ReadonlyArray<number> = RA.makeBy(210, (index) => index)

const PageBackdrop = () => (
  <div
    aria-hidden='true'
    className='pointer-events-none fixed inset-0 -z-10 overflow-hidden text-[#0c1014] dark:text-white'
  >
    <svg className='absolute top-1/2 left-1/2 size-[150vmax] -translate-1/2 -rotate-30'>
      <g
        fill='currentColor'
        fillOpacity='0.014'
        fontSize={FONT_SIZE_PX}
        fontStyle='italic'
        fontWeight='900'
        letterSpacing='-0.7'
      >
        {pipe(
          rowList,
          RA.map((index) => (
            <text
              key={index}
              x={index % 2 === 0 ? -20 : -51}
              y={(index + 1) * FONT_SIZE_PX}
            >
              {ROW_TEXT}
            </text>
          )),
        )}
      </g>
    </svg>
  </div>
)

export const PageBackdropMemo = memo(PageBackdrop)
