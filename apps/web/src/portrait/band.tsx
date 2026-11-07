import * as EqClass from 'fp-ts/Eq'
import * as RA from 'fp-ts/ReadonlyArray'
import * as S from 'fp-ts/string'
import { memo } from 'react'

import { gridRowsView } from './grid-rows'

// A band of rows of the portrait (the hair, the eyes, the still rows between
// them): each character shows the photo, or a slice of a sprite sheet,
// through it (.portrait-part in index.css)
export interface BandProps {
  rows: readonly string[]
  image: string
  size: string
  positionY: string
}

// The frame clock renders the portrait on every frame, but a band changes
// only when its own frame does (the still rows never): memo keeps the rest of
// the portrait as it is, so a frame touches only the band that moved
const BandPropsEq: EqClass.Eq<BandProps> = EqClass.struct<BandProps>({
  rows: RA.getEq(S.Eq),
  image: S.Eq,
  size: S.Eq,
  positionY: S.Eq,
})

const BandComponent = ({ rows, image, size, positionY }: BandProps) => (
  <span
    className='portrait-part'
    style={{
      backgroundImage: `url(${image})`,
      backgroundSize: size,
      backgroundPositionY: positionY,
    }}
  >
    {gridRowsView(rows)}
  </span>
)

export const BandMemo = memo(BandComponent, BandPropsEq.equals)
