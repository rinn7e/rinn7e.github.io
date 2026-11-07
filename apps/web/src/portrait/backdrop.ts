// The faint ASCII field behind the portrait: a flat, even texture of light
// characters, mostly dots with a sprinkle of : and +, mirror symmetric around
// the middle of the screen.

// Which character a cell gets, from a hash of its position: the same cell
// always gets the same one, so the field does not flicker on a re-render
const cellChar = (x: number, y: number): string => {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  const r = ((h ^ (h >>> 16)) >>> 0) / 4294967296
  if (r < 0.08) return '+'
  if (r < 0.24) return ':'
  return '.'
}

// For each row, the first and last columns that are part of the face in any
// of the grids, or null for a row with nothing in it. Blank cells inside the
// face count too. Pass both the light and the dark grid: a brightly lit cheek
// is blank in the light one and dense in the dark one, so one grid alone can
// miss part of the face.
export const faceSpans = (...grids: string[]): ([number, number] | null)[] => {
  const spans: ([number, number] | null)[] = []
  for (const grid of grids) {
    grid.split('\n').forEach((line, row) => {
      const start = line.search(/\S/)
      if (start < 0) return
      const end = line.trimEnd().length - 1
      const span = spans[row]
      spans[row] = span
        ? [Math.min(span[0], start), Math.max(span[1], end)]
        : [start, end]
    })
  }
  return Array.from(spans, (span) => span ?? null)
}

// `hole` says which cells to leave blank, so the field never shows through
// the face. Every other column is blank, for an airy texture.
export const backdropGrid = (
  cols: number,
  rows: number,
  hole: (x: number, y: number) => boolean = () => false,
): string => {
  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    let line = ''
    for (let x = 0; x < cols; x++) {
      // Mirrored: a cell and its twin across the middle use the same hash
      const mx = Math.min(x, cols - 1 - x)
      line += mx % 2 === 1 || hole(x, y) ? ' ' : cellChar(mx, y)
    }
    lines.push(line)
  }
  return lines.join('\n')
}
