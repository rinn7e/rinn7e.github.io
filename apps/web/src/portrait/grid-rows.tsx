// The rows of an ASCII grid (the portrait, its glow, the field behind it),
// each a block exactly one row tall (.grid-row in index.css). Safari lays a
// line of text out at a whole number of pixels, so at the small sizes of the
// portrait plain lines squash the grid (on a phone a 3.6px line becomes 3px,
// and the face a sixth shorter, out of line with its colours and the eye
// zones); a block keeps its exact height in every browser.
export const gridRowsView = (rows: readonly string[]) =>
  rows.map((row, i) => (
    <span key={i} className='grid-row'>
      {row}
    </span>
  ))
