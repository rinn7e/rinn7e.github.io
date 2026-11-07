// The geometry of the eyes in the photo the grid was made from (624x960
// pixels), copied from tools/eye-geometry.mjs of the design tools,
// where it was measured: the lights over the eyes must match the drawing.

// The size of the photo, in pixels
export const PHOTO_WIDTH = 624
export const PHOTO_HEIGHT = 960

// The irises: centre and radius, left eye first
export const IRISES = [
  { x: 200, y: 487, r: 22 },
  { x: 428, y: 487, r: 22 },
] as const

// The open eyes, in the order of IRISES: [x, upper lid edge, lower lid
// edge] every 6px across, from corner to corner
type LidPoint = readonly [x: number, top: number, bottom: number]
export const OPENINGS: readonly (readonly LidPoint[])[] = [
  [
    [137, 492, 492],
    [140, 492, 493],
    [146, 484, 495],
    [152, 481, 495],
    [158, 475, 498],
    [164, 474, 502],
    [170, 473, 505],
    [176, 473, 504],
    [182, 472, 505],
    [188, 473, 510],
    [194, 472, 510],
    [200, 473, 512],
    [206, 473, 510],
    [212, 473, 509],
    [218, 474, 509],
    [224, 473, 508],
    [230, 474, 507],
    [236, 474, 507],
    [242, 476, 506],
    [248, 481, 506],
    [253, 494, 494],
  ],
  [
    [378, 496, 496],
    [382, 485, 507],
    [388, 479, 506],
    [394, 478, 508],
    [400, 476, 507],
    [406, 476, 508],
    [412, 476, 510],
    [418, 475, 511],
    [424, 476, 513],
    [430, 476, 511],
    [436, 476, 511],
    [442, 476, 507],
    [448, 476, 499],
    [454, 477, 495],
    [460, 477, 494],
    [466, 478, 490],
    [472, 479, 491],
    [478, 481, 491],
    [484, 482, 489],
    [490, 485, 488],
    [495, 485, 489],
    [500, 488, 488],
  ],
]
