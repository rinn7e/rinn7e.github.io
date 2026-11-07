import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { RED_EYE_STYLES, type RedEyeStyle } from '../red-eye-style'
import { type Screen2Mode } from '../screen-2'
import {
  EYE_FROM,
  EYE_ROWS,
  type EyeState,
  HAIR_ROWS,
  blinkFrameAt,
  breathOffset,
  eyeFrame,
  fallStepAt,
  hairFrameAt,
  riseStepAt,
  spinFrameAt,
} from './animate'
import { BackdropLayer } from './backdrop-layer'
import { IRISES, OPENINGS, PHOTO_HEIGHT, PHOTO_WIDTH } from './eye-geometry'
import { gridRowsView } from './grid-rows'
import { type Frames, PORTRAIT_ROWS, type Portrait } from './portrait'
import { FACE_SHRINK } from './screen-fade'

// The portrait with its subtle life: it breathes, its hair moves in the wind,
// it blinks now and then, and now and then its eyes turn into a spinning
// red eye for a few seconds, in the open eye. The red eye button turns it
// on until it is pressed again, with no blinks meanwhile, and so does the
// mouse over an eye, until it leaves; the edge of the iris under the mouse
// glows meanwhile, a light over the drawing. Every change to the
// drawing is a drawn frame,
// like a sprite (see "Animation" in doc/code-convention.md): the hair and
// the eyes are bands of rows that show their current frame. One frame clock
// drives all of it, at the frame rate set with the slider in the corner, so
// a low rate gives a stepped, hand-drawn motion. Behind the portrait, a faint
// ASCII field fills the screen. The controls in the corner are for
// debugging and show in the dev build only. A component, not a view function, because
// the animation is local state the model has no use for. The pause button
// freezes it all mid-motion. With reduced motion only a blink asked for with
// the button moves.

// The wait between blinks, in milliseconds, and the pause inside a double
// blink
const BLINK_EVERY = [3500, 7500] as const
const DOUBLE_BLINK_GAP = 160

// The wait for the red eye, in milliseconds: after the page loads, and
// after it goes away (so the eyes stay normal that long between showings).
// How long it stays (animation time) when it comes by itself; turned on with
// the button, it stays until the button turns it off. It turns on and off in
// the open eye.
const RED_EYE_FIRST = 3000
const RED_EYE_EVERY = [3000, 6000] as const
const RED_EYE_MS = 10000

// One full turn of the tomoe on the red eye button, in milliseconds
const ICON_TURN_MS = 2000

// How long the mouse can be off the eyes (passing from one to the other)
// before the red eye it started stops, in milliseconds
const EYE_HOVER_GRACE = 200

// The frame rates the slider offers. The hair has 8 drawings a second, so a
// higher rate than 30 adds nothing.
export const FPS_MIN = 2
export const FPS_MAX = 30
// Stepped enough to feel hand-drawn, smooth enough to read as motion
export const FPS_DEFAULT = 10

const between = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min)

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

export const PortraitArt = ({
  portrait,
  onOpen,
  hold,
  fade,
  redEyeStyle,
  onRedEyeStyle,
}: {
  portrait: Portrait
  // Opens screen 2: on the principles from a click on an eye, once
  // its red eye is on, or on the links from the arrow button, at once
  onOpen: (mode: Screen2Mode) => void
  // While screen 2 is open (or opening or closing): the red eye
  // stays on, even when the mouse is no longer over an eye
  hold: boolean
  // How far the face has faded out for screen 2 (0 to 1); the field
  // around it fills its place
  fade: number
  // The look of the red eye, and a pick from its switch
  redEyeStyle: RedEyeStyle
  onRedEyeStyle: (style: RedEyeStyle) => void
}) => {
  const eyeFrames = portrait.eyes[redEyeStyle]
  const lines = useMemo(() => portrait.grid.split('\n'), [portrait.grid])
  const art = useRef<HTMLPreElement>(null)
  // The hair frame shown, or null for the still hair (reduced motion)
  const [hair, setHair] = useState<number | null>(
    prefersReducedMotion() ? null : 0,
  )
  // What the eyes show, whether the red eye is out (turning on, on or
  // turning off), and whether the button has it on (the button glows then)
  const [eyes, setEyes] = useState<EyeState>({ kind: 'normal', blink: 0 })
  const [redEye, setRedEye] = useState(false)
  const [demand, setDemand] = useState(false)
  // The eye the mouse is over (an index of EYE_ZONES), which glows while
  // its red eye shows; and the eye that glows last, so the glow fades out
  // where it was
  const [hoveredEye, setHoveredEye] = useState<number | null>(null)
  const [glowEye, setGlowEye] = useState(0)
  const [fps, setFps] = useState(FPS_DEFAULT)
  const [paused, setPaused] = useState(false)
  // The panel of debug controls, behind the gear in the top right corner on
  // a narrow screen; on a wide one it always shows, as it fits beside the
  // arrow button
  const [debugOpen, setDebugOpen] = useState(false)
  const wide = useWide()
  const debugShown = wide || debugOpen
  // The animation time in ms: it runs with the real clock, and stands still
  // while paused, so a pause freezes everything mid-motion and play goes on
  // from there
  const clock = useRef(0)
  const pausedNow = useRef(false)
  pausedNow.current = paused
  // When the current blink started (animation time), and how many more to
  // run after it
  const blinkStart = useRef<number | null>(null)
  const blinksQueued = useRef(0)
  // The red eye: off, asked for (it turns on once a blink is over),
  // turning on, on, or turning off; and when that phase started
  const phase = useRef<'off' | 'asked' | 'rising' | 'on' | 'falling'>('off')
  const phaseStart = useRef(0)
  // Turning off: asked for with the button, and the turn it turns off at
  const endAsked = useRef(false)
  const fallSpin = useRef(0)
  // Turned on with the button: it stays until the button turns it off, and
  // the eyes do not blink by themselves meanwhile. Pressed while one that
  // came by itself turns off, it turns on again once that is over.
  const onDemand = useRef(false)
  const demandQueued = useRef(false)

  const requestBlink = useCallback((count = 1) => {
    if (blinkStart.current !== null || pausedNow.current) return
    // The eyes do not blink while the red eye turns on or off
    if (phase.current === 'rising' || phase.current === 'falling') return
    blinkStart.current = clock.current
    blinksQueued.current = count - 1
  }, [])

  // Shows the red eye: for a while when it comes by itself, or until the
  // button turns it off (`demand`)
  const requestRedEye = useCallback((demand: boolean) => {
    if (phase.current !== 'off' || pausedNow.current) return
    phase.current = 'asked'
    onDemand.current = demand
    setRedEye(true)
  }, [])

  // On demand: shows the red eye until asked to stop, and keeps one that
  // came by itself the same way (or, if that one is turning off, turns on
  // again once it is over)
  const startDemand = useCallback(() => {
    if (pausedNow.current || onDemand.current || demandQueued.current) return
    setDemand(true)
    if (phase.current === 'off') {
      requestRedEye(true)
    } else if (phase.current === 'falling') {
      demandQueued.current = true
    } else {
      onDemand.current = true
      endAsked.current = false
    }
  }, [requestRedEye])

  // Stops the red eye on demand: turns it off (or calls off one asked
  // for); one turning on finishes first
  const stopDemand = useCallback(() => {
    if (pausedNow.current) return
    setDemand(false)
    if (demandQueued.current) {
      demandQueued.current = false
      return
    }
    if (!onDemand.current) return
    onDemand.current = false
    if (phase.current === 'asked') {
      phase.current = 'off'
      setRedEye(false)
    } else {
      endAsked.current = true
    }
  }, [])

  // The mouse over an eye: entering one starts the red eye on demand,
  // leaving stops it, if entering started it (one turned on with the button
  // stays). Passing from one eye to the other within EYE_HOVER_GRACE keeps
  // it on.
  const hoverStarted = useRef(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const enterEye = useCallback(() => {
    clearTimeout(leaveTimer.current)
    if (onDemand.current || demandQueued.current || pausedNow.current) return
    startDemand()
    hoverStarted.current = true
  }, [startDemand])
  const leaveEye = useCallback(() => {
    if (!hoverStarted.current) return
    clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(() => {
      // Kept on for a click on its way, or while screen 2 is open
      if (clickWaiting.current || holdNow.current) return
      hoverStarted.current = false
      stopDemand()
    }, EYE_HOVER_GRACE)
  }, [stopDemand])
  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  // A click on an eye: screen 2 opens once the red eye is on, so
  // the switch always starts from it; a click before that turns it on (or
  // lets it finish turning on) and waits
  const holdNow = useRef(hold)
  const hovering = useRef<number | null>(null)
  const clickWaiting = useRef<(() => void) | null>(null)
  const onOpenNow = useRef(onOpen)
  useEffect(() => {
    holdNow.current = hold
    onOpenNow.current = onOpen
  })
  const clickEye = useCallback(() => {
    const open = () => onOpenNow.current('principles')
    if (phase.current === 'on' || pausedNow.current) return open()
    if (!onDemand.current && !demandQueued.current) {
      startDemand()
      hoverStarted.current = true
    }
    clickWaiting.current = open
  }, [startDemand])

  // Screen 2 closed: a red eye the mouse turned on goes off now,
  // if the mouse is no longer over an eye
  useEffect(() => {
    if (hold || !hoverStarted.current || hovering.current !== null) return
    hoverStarted.current = false
    stopDemand()
  }, [hold, stopDemand])

  // The button: starts the red eye on demand, or stops it
  const toggleRedEye = useCallback(() => {
    hoverStarted.current = false
    clearTimeout(leaveTimer.current)
    if (onDemand.current || demandQueued.current) stopDemand()
    else startDemand()
  }, [startDemand, stopDemand])

  // Blinks now and then, sometimes twice, but not while the red eye shows
  // on demand
  useEffect(() => {
    if (prefersReducedMotion()) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        if (!onDemand.current) requestBlink(Math.random() < 0.2 ? 2 : 1)
        schedule()
      }, between(BLINK_EVERY))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [requestBlink])

  // Shows the red eye now and then: RED_EYE_FIRST after the page loads,
  // then a while after each showing ends
  const shownOnce = useRef(false)
  useEffect(() => {
    if (prefersReducedMotion() || redEye) return
    const wait = shownOnce.current ? between(RED_EYE_EVERY) : RED_EYE_FIRST
    shownOnce.current = true
    const timer = setTimeout(() => requestRedEye(false), wait)
    return () => clearTimeout(timer)
  }, [redEye, requestRedEye])

  // Spins the tomoe on the red eye button while the button has it on, at
  // the screen rate and on the real clock: the button is not part of the
  // drawing, so the frame rate and the pause do not apply to it. Only the
  // transform of the icon changes, on its own layer (index.css), so a turn
  // moves the drawn icon and paints nothing.
  const icon = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = icon.current
    if (!demand || !el || prefersReducedMotion()) return
    let raf = 0
    let start: number | null = null
    const turn = (now: number) => {
      start ??= now
      const degrees = (((now - start) / ICON_TURN_MS) * 360) % 360
      el.style.transform = `rotate(${degrees}deg)`
      raf = requestAnimationFrame(turn)
    }
    raf = requestAnimationFrame(turn)
    return () => {
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [demand])

  // The frame clock: samples the motion once per frame at the chosen rate
  useEffect(() => {
    const still = prefersReducedMotion()
    const frameMs = 1000 / fps
    let lastReal: number | null = null
    let lastFrame = -Infinity
    let raf = 0
    const tick = (real: number) => {
      raf = requestAnimationFrame(tick)
      if (lastReal !== null && !pausedNow.current)
        clock.current += real - lastReal
      lastReal = real
      const now = clock.current
      if (pausedNow.current || now - lastFrame < frameMs - 1) return
      lastFrame = now
      const t = now / 1000
      if (!still) {
        if (art.current) {
          art.current.style.transform = `translateY(${breathOffset(t)}px)`
        }
        setHair(hairFrameAt(t))
      }
      // The blink, if one is on its way
      let blink = 0
      const start = blinkStart.current
      if (start !== null && now >= start) {
        const frame = blinkFrameAt(now - start, frameMs)
        blink = frame ?? 0
        if (frame === null) {
          blinkStart.current =
            blinksQueued.current > 0 ? now + DOUBLE_BLINK_GAP : null
          blinksQueued.current = Math.max(0, blinksQueued.current - 1)
        }
      }
      const blinking = blinkStart.current !== null
      // The turn of the red eye: from its first turn when it came on, so
      // it picks up where turning on left off
      const spin = still ? 0 : spinFrameAt((now - phaseStart.current) / 1000)

      // The red eye: asked for, it turns on once no blink is on its way,
      // at its first turn; its time up (when it came by itself) or turned
      // off with the button, it turns off at the turn it is at, once no
      // blink is on its way
      if (phase.current === 'asked' && !blinking) {
        phase.current = 'rising'
        phaseStart.current = now
      }
      if (
        phase.current === 'on' &&
        (endAsked.current ||
          (!onDemand.current && now - phaseStart.current >= RED_EYE_MS)) &&
        !blinking
      ) {
        phase.current = 'falling'
        phaseStart.current = now
        fallSpin.current = spin
        endAsked.current = false
      }
      if (phase.current === 'rising') {
        const step = riseStepAt(now - phaseStart.current)
        if (step === null) {
          phase.current = 'on'
          phaseStart.current = now
          // On: a click that waited for it opens screen 2
          const open = clickWaiting.current
          clickWaiting.current = null
          open?.()
        } else {
          setEyes({ kind: 'rise', spin: 0, step })
          return
        }
      }
      if (phase.current === 'falling') {
        const step = fallStepAt(now - phaseStart.current)
        if (step === null && demandQueued.current) {
          demandQueued.current = false
          onDemand.current = true
          phase.current = 'asked'
        } else if (step === null) {
          phase.current = 'off'
          onDemand.current = false
          setRedEye(false)
        } else {
          setEyes({ kind: 'rise', spin: fallSpin.current, step })
          return
        }
      }
      setEyes(
        phase.current === 'on'
          ? {
              kind: 'redEye',
              spin: still ? 0 : spinFrameAt((now - phaseStart.current) / 1000),
              blink,
            }
          : { kind: 'normal', blink },
      )
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fps])

  // The bands of rows, top to bottom: the still rows of the grid, or the
  // current frame of an animated band
  const bands: Band[] = [
    animatedBand(lines, 0, HAIR_ROWS, portrait.hair, hair, portrait.photo),
    stillBand(lines, HAIR_ROWS, EYE_FROM, portrait.photo),
    animatedBand(
      lines,
      EYE_FROM,
      EYE_ROWS,
      eyeFrames,
      eyeFrame(eyes),
      portrait.photo,
    ),
    stillBand(lines, EYE_FROM + EYE_ROWS, PORTRAIT_ROWS, portrait.photo),
  ]

  return (
    <>
      <BackdropLayer portrait={art} fill={fade} />
      <pre
        ref={art}
        role='img'
        aria-label='ASCII portrait of Moremi Vannak'
        className='portrait'
        style={{
          opacity: 1 - fade,
          scale: 1 - FACE_SHRINK * fade,
          willChange: fade > 0 && fade < 1 ? 'opacity, scale' : undefined,
        }}
      >
        {bands.map((band) => (
          <span key={band.from} className='portrait-part' style={band.style}>
            {gridRowsView(band.rows)}
          </span>
        ))}
        {irisGlowView(
          eyeFrames,
          eyeFrame(eyes),
          glowEye,
          hoveredEye === glowEye && eyes.kind !== 'normal',
        )}
        {EYE_ZONES.map((zone, i) => (
          <span
            key={zone.col}
            aria-hidden='true'
            className='eye-zone cursor-pointer'
            style={{
              left: `${zone.col * CELL_WIDTH}em`,
              top: `${zone.row * LINE_HEIGHT}em`,
              width: `${zone.cols * CELL_WIDTH}em`,
              height: `${zone.rows * LINE_HEIGHT}em`,
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse') return
              hovering.current = i
              setHoveredEye(i)
              setGlowEye(i)
              enterEye()
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'mouse') return
              if (hovering.current === i) hovering.current = null
              setHoveredEye((eye) => (eye === i ? null : eye))
              leaveEye()
            }}
            onClick={clickEye}
          />
        ))}
      </pre>
      {/* For visitors: opens screen 2 at once, unlike a click on an
          eye, which waits for the red eye. Only while the portrait fully
          shows: it goes as soon as the switch starts, and screen 2
          puts its close button here instead. */}
      {screen2ButtonView('top', !hold, () => onOpen('links'))}
      {screen2ButtonView('bottom', !hold, () => onOpen('links'))}
      {/* Debug controls, in the dev build only: production leaves them out.
          On a wide screen they sit in the top right corner; on a narrow one
          they fold behind a gear there, which opens them in a panel below
          it, so they never reach the arrow button at the top centre. Like the arrow button, they belong to the
          portrait: they fade out as the switch to screen 2 starts
          and back in once the portrait fully shows again (a plain fade,
          .fade in index.css). */}
      {import.meta.env.DEV && (
        <div inert={hold} className={`fade ${hold ? 'fade-hidden' : ''}`}>
          {!wide && gearButtonView(debugOpen, () => setDebugOpen((o) => !o))}
          <div
            id='debug-controls'
            inert={!debugShown}
            className={`fade fixed ${wide ? 'top-4' : 'top-17'} right-4 z-10 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2 ${debugShown ? '' : 'fade-hidden'}`}
          >
            {fpsSliderView(fps, setFps)}
            {pauseButtonView(paused, () => setPaused((p) => !p))}
            {blinkButtonView(() => requestBlink())}
            {redEyeButtonView(demand, icon, toggleRedEye)}
            {redEyeStyleView(redEyeStyle, onRedEyeStyle)}
          </div>
        </div>
      )}
    </>
  )
}

// The height of a grid row, in em (see .portrait in index.css), and of the
// whole grid; and the width of a cell
const LINE_HEIGHT = 1.09
const GRID_HEIGHT = 138.43
const CELL_WIDTH = 0.6

// Where the eyes are on the grid, in cells: the open eyes measured in
// tools/eye-geometry.mjs of the design tools (columns 33 to 61
// and 91 to 120, rows 62.5 to 68), with a margin of two columns and about a
// row, so the mouse finds them easily
const EYE_ZONES = [
  { col: 31, row: 61, cols: 32, rows: 8 },
  { col: 89, row: 61, cols: 33, rows: 8 },
] as const

// The size of a pixel of the photo (eye-geometry.ts) on the grid, in em
const PX_WIDTH = 90 / PHOTO_WIDTH
const PX_HEIGHT = GRID_HEIGHT / PHOTO_HEIGHT

// The glow of an eye, in iris radii from its centre: clear inside GLOW_CLEAR
// (so the red eye shows as drawn), brightest at GLOW_PEAK, just past the
// edge of the iris, and gone at GLOW_END
const GLOW_CLEAR = 0.6
const GLOW_PEAK = 1.15
const GLOW_SOFT = 2
const GLOW_END = 3.2

// The red light on the eye `eye` (an index of IRISES): the characters of the
// eye rows in frame `frame` again, over the drawing, lit red in a ring
// around the iris and cut to the open eye, so it lights only the characters
// between the lids and leaves the gaps between them dark. Only the columns
// of that eye, so the layer stays small. It fades in and out (`on`) once,
// with an opacity transition (.iris-glow in index.css).
const irisGlowView = (
  { frames }: Frames,
  frame: number,
  eye: number,
  on: boolean,
) => {
  const iris = IRISES[eye]
  const opening = OPENINGS[eye]
  if (!iris || !opening) return null
  // The columns of the eye, with a cell to spare on each side
  const xs = opening.map(([x]) => x)
  const fromCol = Math.floor((Math.min(...xs) * PX_WIDTH) / CELL_WIDTH) - 1
  const toCol = Math.ceil((Math.max(...xs) * PX_WIDTH) / CELL_WIDTH) + 1
  // From the top left of the layer, in em
  const top = EYE_FROM * LINE_HEIGHT
  const left = fromCol * CELL_WIDTH
  const point = (x: number, y: number) =>
    `${x * PX_WIDTH - left}em ${y * PX_HEIGHT - top}em`
  const r = (k: number) => `${k * iris.r * PX_WIDTH}em`
  const lids = [
    ...opening.map(([x, upper]) => point(x, upper)),
    ...[...opening].reverse().map(([x, , lower]) => point(x, lower)),
  ]
  return (
    <span
      aria-hidden='true'
      className={`iris-glow ${on ? 'iris-glow-on' : ''}`}
      style={{
        top: `${top}em`,
        left: `${left}em`,
        width: `${(toCol - fromCol) * CELL_WIDTH}em`,
        backgroundImage: `radial-gradient(circle at ${point(iris.x, iris.y)}, transparent ${r(GLOW_CLEAR)}, var(--iris-glow) ${r(GLOW_PEAK)}, var(--iris-glow-soft) ${r(GLOW_SOFT)}, transparent ${r(GLOW_END)})`,
        clipPath: `polygon(${lids.join(', ')})`,
      }}
    >
      {gridRowsView(
        (frames[frame] ?? []).map((row) => row.slice(fromCol, toCol)),
      )}
    </span>
  )
}

interface Band {
  from: number
  rows: readonly string[]
  style: CSSProperties
}

// Rows `from` up to `to` of the still grid, coloured by the slice of the
// photo behind them
const stillBand = (
  lines: string[],
  from: number,
  to: number,
  photo: string,
): Band => ({
  from,
  rows: lines.slice(from, to),
  style: {
    backgroundImage: `url(${photo})`,
    backgroundSize: `90em ${GRID_HEIGHT}em`,
    backgroundPositionY: `${-from * LINE_HEIGHT}em`,
  },
})

// `rows` rows from `from`: frame `frame` of the drawn frames, coloured by its
// slice of the sprite sheet, or the still grid when `frame` is null
const animatedBand = (
  lines: string[],
  from: number,
  rows: number,
  { frames, sprite }: Frames,
  frame: number | null,
  photo: string,
): Band =>
  frame === null
    ? stillBand(lines, from, from + rows, photo)
    : {
        from,
        rows: frames[frame] ?? [],
        style: {
          backgroundImage: `url(${sprite})`,
          backgroundSize: `90em ${frames.length * rows * LINE_HEIGHT}em`,
          backgroundPositionY: `${-frame * rows * LINE_HEIGHT}em`,
        },
      }

const CORNER_CONTROL =
  'corner-button flex h-11 items-center rounded-full border border-line text-ink-muted'

// The frame rate of the animation
const fpsSliderView = (fps: number, setFps: (fps: number) => void) => (
  <label className={`${CORNER_CONTROL} gap-2 px-3 text-xs sm:px-4`}>
    <span className='w-10 tabular-nums sm:w-12'>{fps} fps</span>
    <input
      type='range'
      min={FPS_MIN}
      max={FPS_MAX}
      step={1}
      value={fps}
      aria-label='Animation frames per second'
      className='w-14 cursor-pointer accent-current sm:w-28'
      onChange={(e) => setFps(Number(e.currentTarget.value))}
    />
  </label>
)

const CORNER_BUTTON = `${CORNER_CONTROL} size-11 cursor-pointer justify-center transition-colors hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link`

// Freezes the animation where it is (even mid-blink), and plays it on from
// there. Shows what a press does: pause while playing, play while paused.
const pauseButtonView = (paused: boolean, onToggle: () => void) => (
  <button
    type='button'
    aria-label={paused ? 'Play the animation' : 'Pause the animation'}
    aria-pressed={paused}
    title={paused ? 'Play' : 'Pause'}
    className={CORNER_BUTTON}
    onClick={onToggle}
  >
    <svg
      viewBox='0 0 24 24'
      className='size-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {paused ? <path d='M8 5.5v13l10.5-6.5z' /> : <path d='M9 6v12M15 6v12' />}
    </svg>
  </button>
)

// Blinks on demand, even with reduced motion: the visitor asked for it
const blinkButtonView = (onBlink: () => void) => (
  <button
    type='button'
    aria-label='Blink'
    title='Blink'
    className={CORNER_BUTTON}
    onClick={onBlink}
  >
    <svg
      viewBox='0 0 24 24'
      className='size-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z' />
      <circle cx='12' cy='12' r='2.75' />
    </svg>
  </button>
)

// Shows the red eye until pressed again, or turns it off; even with
// reduced motion, as the visitor asked for it. While it has it on (`on`, not
// when the red eye comes by itself), the button glows red and its tomoe
// spin (turned through `icon` by PortraitArt).
const redEyeButtonView = (
  on: boolean,
  icon: RefObject<SVGSVGElement | null>,
  onToggle: () => void,
) => (
  <button
    type='button'
    aria-label={on ? 'Hide the red eye' : 'Show the red eye'}
    aria-pressed={on}
    title='Red eye'
    className={`${CORNER_BUTTON} ${on ? 'red-eye-button-on' : ''}`}
    onClick={onToggle}
  >
    <svg
      ref={icon}
      viewBox='0 0 24 24'
      className='size-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='8.5' />
      <circle cx='12' cy='12' r='4.5' strokeWidth='1' />
      <circle cx='12' cy='12' r='1.5' fill='currentColor' stroke='none' />
      <circle cx='12' cy='7.5' r='1.6' fill='currentColor' stroke='none' />
      <circle cx='15.9' cy='14.25' r='1.6' fill='currentColor' stroke='none' />
      <circle cx='8.1' cy='14.25' r='1.6' fill='currentColor' stroke='none' />
    </svg>
  </button>
)

// The switch for the look of the red eye: 1, the tomoe, or 2, the
// pinwheel. Shows the style in use as pressed.
const redEyeStyleView = (
  style: RedEyeStyle,
  onPick: (style: RedEyeStyle) => void,
) => (
  <div
    role='group'
    aria-label='Red eye style'
    className={`${CORNER_CONTROL} gap-1 px-1.5 text-xs`}
  >
    {RED_EYE_STYLES.map((s, i) => (
      <button
        key={s}
        type='button'
        aria-label={`Red eye style ${i + 1}`}
        aria-pressed={s === style}
        title={`Red eye style ${i + 1}`}
        className={`flex size-8 cursor-pointer items-center justify-center rounded-full tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${s === style ? 'red-eye-style-on' : 'hover:text-ink'}`}
        onClick={() => onPick(s)}
      >
        {i + 1}
      </button>
    ))}
  </div>
)

// Opens screen 2 at once, without waiting for the red eye as a
// click on an eye does: an arrow, pointing up at the bottom centre and
// down at the top centre (the same arrow turned round), both toward the
// face, so the portrait is the same turned round, like screen
// 2 with its two close buttons. Always in the page, so it can pop in
// and out (.pop in index.css); while hidden it is inert (no focus, no
// clicks).
const screen2ButtonView = (
  edge: 'top' | 'bottom',
  shown: boolean,
  onOpen: () => void,
) => (
  <button
    type='button'
    aria-label='About me'
    title='About me'
    inert={!shown}
    className={`${CORNER_BUTTON} pop fixed ${edge === 'top' ? 'top-4' : 'bottom-4'} left-1/2 z-10 -translate-x-1/2 ${shown ? '' : 'pop-hidden'}`}
    onClick={onOpen}
  >
    <svg
      viewBox='0 0 24 24'
      className={`size-5 ${edge === 'top' ? 'rotate-180' : ''}`}
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M12 19V5M5.5 11.5 12 5l6.5 6.5' />
    </svg>
  </button>
)

// Opens and closes the panel of debug controls (dev build only): a gear, in
// the top right corner, pressed while the panel is open
const gearButtonView = (open: boolean, onToggle: () => void) => (
  <button
    type='button'
    aria-label={open ? 'Hide the debug controls' : 'Show the debug controls'}
    aria-expanded={open}
    aria-controls='debug-controls'
    title='Debug controls'
    className={`${CORNER_BUTTON} fixed top-4 right-4 z-10 ${open ? 'text-ink' : ''}`}
    onClick={onToggle}
  >
    <svg
      viewBox='0 0 24 24'
      className='size-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
    </svg>
  </button>
)

// Whether the screen is wide (64rem, the lg breakpoint, and up): wide
// enough for the debug controls to sit beside the arrow button. Follows
// the screen as it is resized (on the query's change, and on a resize too,
// as some emulated resizes send no change).
const WIDE = '(min-width: 64rem)'
const useWide = (): boolean =>
  useSyncExternalStore(
    (onChange) => {
      if (typeof matchMedia !== 'function') return () => undefined
      const query = matchMedia(WIDE)
      query.addEventListener('change', onChange)
      addEventListener('resize', onChange)
      return () => {
        query.removeEventListener('change', onChange)
        removeEventListener('resize', onChange)
      }
    },
    () => typeof matchMedia === 'function' && matchMedia(WIDE).matches,
  )
