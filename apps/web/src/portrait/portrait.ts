import { type RedEyeStyle } from '../red-eye-style'
import { EYE_FRAMES, EYE_ROWS, HAIR_FRAMES, HAIR_ROWS } from './animate'
import eyeSpriteDark from './eye-frames-dark.jpg'
import eyeTextDark from './eye-frames-dark.txt?raw'
import eyeSprite2Dark from './eye-frames-style2-dark.jpg'
import eyeText2Dark from './eye-frames-style2-dark.txt?raw'
import eyeSprite2 from './eye-frames-style2.jpg'
import eyeText2 from './eye-frames-style2.txt?raw'
import eyeSprite from './eye-frames.jpg'
import eyeText from './eye-frames.txt?raw'
import photoDark from './face-color-dark.jpg'
import photo from './face-color.jpg'
import hairSpriteDark from './hair-frames-dark.jpg'
import hairTextDark from './hair-frames-dark.txt?raw'
import hairSprite from './hair-frames.jpg'
import hairText from './hair-frames.txt?raw'
import gridDark from './portrait-dark.txt?raw'
import grid from './portrait.txt?raw'

// The face as ASCII art, made by the design tools of the portrait (its
// colour design). The grid keeps its blank rows and columns, so it covers the photo
// exactly and each character can take the colour of the photo under it.
export const PORTRAIT_COLS = 150
export const PORTRAIT_ROWS = 127

// Drawn frames of a band of rows, like a sprite: the text of each frame, and
// the sprite sheet of their colours, one frame below the other
export interface Frames {
  frames: string[][]
  sprite: string
}

export interface Portrait {
  grid: string
  photo: string
  // The hair in the wind: frames of the top HAIR_ROWS rows
  hair: Frames
  // The eyes: frames of the eye rows (the blink, and the red eye), for
  // each style of the red eye
  eyes: Record<RedEyeStyle, Frames>
}

// The frames from a text file: `rows` lines each, one after the other
const framesOf = (
  text: string,
  count: number,
  rows: number,
  sprite: string,
): Frames => {
  const lines = text.replace(/\n$/, '').split('\n')
  return {
    frames: Array.from({ length: count }, (_, k) =>
      lines.slice(k * rows, (k + 1) * rows),
    ),
    sprite,
  }
}

// On white: the dark parts of the face get the dense characters
export const portraitLight: Portrait = {
  grid: grid.replace(/\n$/, ''),
  photo,
  hair: framesOf(hairText, HAIR_FRAMES, HAIR_ROWS, hairSprite),
  eyes: {
    style1: framesOf(eyeText, EYE_FRAMES, EYE_ROWS, eyeSprite),
    style2: framesOf(eyeText2, EYE_FRAMES, EYE_ROWS, eyeSprite2),
  },
}

// In a dark room: the lit parts of the face get the dense characters and the
// face is brightened; the hair gets denser characters in a very dark grey,
// so it neither turns light gray nor vanishes into the background
export const portraitDark: Portrait = {
  grid: gridDark.replace(/\n$/, ''),
  photo: photoDark,
  hair: framesOf(hairTextDark, HAIR_FRAMES, HAIR_ROWS, hairSpriteDark),
  eyes: {
    style1: framesOf(eyeTextDark, EYE_FRAMES, EYE_ROWS, eyeSpriteDark),
    style2: framesOf(eyeText2Dark, EYE_FRAMES, EYE_ROWS, eyeSprite2Dark),
  },
}
