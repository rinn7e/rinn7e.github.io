import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { backdropGrid, faceSpans } from './backdrop'
import {
  PORTRAIT_COLS,
  PORTRAIT_ROWS,
  portraitDark,
  portraitLight,
} from './portrait'

// The faint ASCII field that fills the screen behind the portrait (see
// .backdrop in index.css). It measures the screen and where the portrait sits
// on it, and leaves the cells over the face blank, with a margin, so the
// field never shows through it. A component, because it measures the page.
//
// The field is drawn on canvases, not written as text: as text it was tens of
// thousands of characters, and on a phone every change to the page (a button
// showing, a switch of screen starting) then took about half a second while
// the field over the face was shown. A canvas is one picture.

// Cells of margin kept clear around the face
const MARGIN_COLS = 2
const MARGIN_ROWS = 1

// The face shape, the same in both modes: from both grids together, as the
// lit cheek is blank in the light grid but dense in the dark one
const SPANS = faceSpans(portraitLight.grid, portraitDark.grid)

interface Layout {
  cols: number
  rows: number
  cellW: number
  cellH: number
  // Where the backdrop grid starts, in pixels: a whole number of cells from
  // the portrait corner, so the two grids line up
  left: number
  top: number
  face: DOMRect | null
}

// Draws the rows of a grid on a canvas of `layout`'s size, in the font and
// colour of `probe` (a .backdrop element, so they come from index.css), each
// character in its own cell, on the line it would take as text
const drawGrid = (
  canvas: HTMLCanvasElement,
  probe: HTMLElement,
  layout: Layout,
  rows: readonly string[],
): void => {
  const { cols, cellW, cellH } = layout
  const dpr = Math.min(devicePixelRatio || 1, 3)
  const width = cols * cellW
  const height = rows.length * cellH
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const style = getComputedStyle(probe)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  ctx.fillStyle = style.color
  ctx.textBaseline = 'alphabetic'
  // The baseline sits as in a line box: half the leading above the font
  const m = ctx.measureText('M')
  const ascent = m.fontBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent
  const baseline = (cellH - (ascent + descent)) / 2 + ascent
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== undefined && ch !== ' ')
        ctx.fillText(ch, x * cellW, y * cellH + baseline)
    }
  })
}

export const BackdropLayer = ({
  portrait,
  gapStyle,
}: {
  portrait: RefObject<HTMLElement | null>
  // The field over the face: as the face fades out for screen 2, it fades
  // in where the face was, so screen 2 shares the same field (its opacity
  // and transition, from portrait-art.tsx)
  gapStyle: CSSProperties
}) => {
  const [layout, setLayout] = useState<Layout | null>(null)
  // An empty .backdrop element, only to read the cell size and colour
  const probe = useRef<HTMLPreElement>(null)
  const field = useRef<HTMLCanvasElement>(null)
  const gap = useRef<HTMLCanvasElement>(null)
  // Counts the switches of theme: the field is drawn again in the colour of
  // the new one once the class of <html> has changed (the colour comes from
  // index.css, and the class is set after the render that changes the theme)
  const [themeTick, setThemeTick] = useState(0)
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((n) => n + 1))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = probe.current
    if (!el) return
    const measure = () => {
      const style = getComputedStyle(el)
      // A JetBrains Mono character is 0.6em wide; the computed line height
      // is in pixels
      const cellW = parseFloat(style.fontSize) * 0.6
      const cellH = parseFloat(style.lineHeight)
      // Where the portrait rests: its breathing moves it a few pixels
      const art = portrait.current
      const rect = art?.getBoundingClientRect() ?? null
      const breath = art
        ? new DOMMatrix(getComputedStyle(art).transform).m42
        : 0
      const face = rect
        ? new DOMRect(rect.x, rect.y - breath, rect.width, rect.height)
        : null
      // Start one cell before the screen edge, on the portrait grid
      const left = face ? (face.left % cellW) - cellW : 0
      const top = face ? (face.top % cellH) - cellH : 0
      setLayout({
        cols: Math.ceil((innerWidth - left) / cellW),
        rows: Math.ceil((innerHeight - top) / cellH),
        cellW,
        cellH,
        left,
        top,
        face,
      })
    }
    measure()
    // Again once the web font is in, as it sets the size of the cells
    void document.fonts.ready.then(measure)
    const observer = new ResizeObserver(measure)
    if (portrait.current) observer.observe(portrait.current)
    addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      removeEventListener('resize', measure)
    }
  }, [portrait])

  // Drawn again only when the layout or the theme changes
  useEffect(() => {
    const el = probe.current
    if (!layout || !el || !field.current || !gap.current) return
    const { cols, rows, cellW, cellH, left, top, face } = layout
    const hole = (x: number, y: number): boolean => {
      if (!face) return false
      const fw = face.width / PORTRAIT_COLS
      const fh = face.height / PORTRAIT_ROWS
      // The centre of this backdrop cell, in pixels from the portrait corner
      const px = left + (x + 0.5) * cellW - face.left
      const py = top + (y + 0.5) * cellH - face.top
      const row = Math.floor(py / fh)
      const marginX = MARGIN_COLS * cellW
      for (let r = row - MARGIN_ROWS; r <= row + MARGIN_ROWS; r++) {
        const span = SPANS[r]
        if (!span) continue
        const from = span[0] * fw - marginX
        const to = (span[1] + 1) * fw + marginX
        if (px >= from && px <= to) return true
      }
      return false
    }
    drawGrid(
      field.current,
      el,
      layout,
      backdropGrid(cols, rows, hole).split('\n'),
    )
    // The field over the face only
    drawGrid(
      gap.current,
      el,
      layout,
      backdropGrid(cols, rows, (x, y) => !hole(x, y)).split('\n'),
    )
  }, [layout, themeTick])

  const place = { left: layout?.left ?? 0, top: layout?.top ?? 0 }
  return (
    <>
      <pre
        ref={probe}
        className='backdrop'
        aria-hidden='true'
        style={{ visibility: 'hidden' }}
      />
      <canvas
        ref={field}
        className='backdrop'
        aria-hidden='true'
        style={place}
      />
      {/* Always in the page, on its own layer, hidden while unused */}
      <canvas
        ref={gap}
        className='backdrop'
        aria-hidden='true'
        style={{ ...place, ...gapStyle, willChange: 'opacity' }}
      />
    </>
  )
}
