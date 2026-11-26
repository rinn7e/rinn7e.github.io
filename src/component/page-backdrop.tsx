import { memo, useEffect, useRef } from 'react'

// The backdrop of every page: the word rinn7e in bold italic rows on a
// diagonal, as on the back of a card and at the same size (the card back
// draws its word at 11% of the width of a 174px card), but in a gray so
// light it is almost not there. A fixed layer behind the content: it stays
// put while the page scrolls, and has no animation. The rows sit in a
// square of 150vmax turned around the centre of the window, which covers
// the window at any size once turned.
//
// It is drawn on a canvas, as the backdrop of `rinn7e/me` is, not written
// as text: as text it was 210 rows of 70 words in every page, which Safari
// Reader took for the article (it showed a blank page) and which made
// every page 100 KB heavier. A canvas is one picture. It is drawn again
// when the window changes size or the system switches between light and
// dark. A memo with no props: a message of the app never draws it again.

const FONT_SIZE_PX = 19
const LETTER_SPACING_PX = -0.7
const ALPHA = 0.014
const ROW_TEXT = Array.from({ length: 70 }, () => 'rinn7e').join(' ')

// Enough rows to fill the square on a large screen (150vmax of a 2560px
// window is 3840px)
const ROW_COUNT = 210

// Draws the rows on `canvas`, the size of the window, in the font and
// color of the canvas element (its CSS color: dark on light, white on dark)
const drawBackdrop = (canvas: HTMLCanvasElement): void => {
  const width = window.innerWidth
  const height = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)
  const context = canvas.getContext('2d')
  if (context !== null) {
    const style = getComputedStyle(canvas)
    const side = 1.5 * Math.max(width, height)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    // The square of rows, turned 30 degrees back around the centre
    context.translate(width / 2, height / 2)
    context.rotate((-30 * Math.PI) / 180)
    context.translate(-side / 2, -side / 2)
    context.font = `italic 900 ${FONT_SIZE_PX}px ${style.fontFamily}`
    context.letterSpacing = `${LETTER_SPACING_PX}px`
    context.fillStyle = style.color
    context.globalAlpha = ALPHA
    for (let index = 0; index < ROW_COUNT; index++) {
      context.fillText(
        ROW_TEXT,
        index % 2 === 0 ? -20 : -51,
        (index + 1) * FONT_SIZE_PX,
      )
    }
  }
}

const PageBackdrop = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return undefined
    }
    // At most once a frame, however many events come in it
    let frame: number | undefined
    const draw = () => {
      if (frame === undefined) {
        frame = requestAnimationFrame(() => {
          frame = undefined
          drawBackdrop(canvas)
        })
      }
    }
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    drawBackdrop(canvas)
    window.addEventListener('resize', draw)
    scheme.addEventListener('change', draw)
    return () => {
      window.removeEventListener('resize', draw)
      scheme.removeEventListener('change', draw)
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 -z-10 size-full text-[#0c1014] dark:text-white'
    />
  )
}

export const PageBackdropMemo = memo(PageBackdrop)
