import { type RefObject, useLayoutEffect, useMemo, useState } from 'react'

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

export const BackdropLayer = ({
  portrait,
  fill = 0,
}: {
  portrait: RefObject<HTMLElement | null>
  // How far the field has filled the gap over the face (0 to 1): as the
  // face fades out for screen 2, the field fades in where it was,
  // so screen 2 shares the same field
  fill?: number
}) => {
  const [layout, setLayout] = useState<Layout | null>(null)
  const [probe, setProbe] = useState<HTMLPreElement | null>(null)

  useLayoutEffect(() => {
    if (!probe) return
    const measure = () => {
      const style = getComputedStyle(probe)
      // A JetBrains Mono character is 0.6em wide; the computed line height
      // is in pixels
      const cellW = parseFloat(style.fontSize) * 0.6
      const cellH = parseFloat(style.lineHeight)
      // Where the portrait rests: its breathing moves it a few pixels
      const el = portrait.current
      const rect = el?.getBoundingClientRect() ?? null
      const breath = el ? new DOMMatrix(getComputedStyle(el).transform).m42 : 0
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
  }, [probe, portrait])

  const { text, gap } = useMemo(() => {
    if (!layout) return { text: '', gap: '' }
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
    return {
      text: backdropGrid(cols, rows, hole),
      // The field over the face only
      gap: backdropGrid(cols, rows, (x, y) => !hole(x, y)),
    }
  }, [layout])

  const place = { left: layout?.left ?? 0, top: layout?.top ?? 0 }
  return (
    <>
      <pre ref={setProbe} className='backdrop' aria-hidden='true' style={place}>
        {text}
      </pre>
      {fill > 0 && (
        <pre
          className='backdrop'
          aria-hidden='true'
          style={{ ...place, opacity: fill }}
        >
          {gap}
        </pre>
      )}
    </>
  )
}
