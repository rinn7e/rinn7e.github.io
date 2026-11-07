import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import { SCREEN_2_GROW, fadeTransition } from './portrait/screen-fade'
import { type ScreenState } from './type'

// The links elsewhere: above the name, and below it
const UP_LINKS = [
  { label: 'insta', href: 'https://www.instagram.com/rinn7e/' },
  { label: 'linkedin', href: 'https://kh.linkedin.com/in/moremi-vannak' },
  { label: 'github', href: 'https://github.com/rinn7e' },
] as const
const DOWN_LINKS = [
  { label: 'dev.to', href: 'https://dev.to/rinn7e' },
  {
    label: '(old) portfolio',
    href: 'https://rinn7e.github.io/rinn7e/portfolio/index.html',
  },
] as const

// The other side of the screen, as on rinn7e.com: the principles I live
// by, counted down above the name (the first one nearest it), and the
// practices that follow from them below it, their numbers after the text,
// as the screen is the same turned round
const PRINCIPLES = [
  'If you are unhappy, it is your fault.',
  'Everything is temporary',
  'We are social beings with a social duty',
  'Hedonism is not the path to happiness',
  'Fame & Fortune are overrated',
  'A philosophy of life must be lived',
  'Do not long for an ideal situation',
  'Maximize positive emotions and minimize negative emotions',
] as const
const PRACTICES = [
  'Rephrase goals so that they are entirely within your control',
  'Have nothing you are not prepared to lose',
  'Live simply',
  'Negative visualization',
  'Exercise self-denial',
  'Resist materialism',
  'Accept what cannot be changed',
  'Refuse to consider yourself the victim',
  'Practice misfortune',
  'Live in accordance with human nature',
] as const
const UP_PRINCIPLES = PRINCIPLES.map((p, i) => `${i + 1}. ${p}`).reverse()
const DOWN_PRACTICES = PRACTICES.map((p, i) => `${p} .${i + 1}`)

// What the screen shows around the name: the links, or the principles. It
// opens on the links from the arrow button and on the principles from an
// eye, and the name switches between them.
export type Screen2Mode = 'links' | 'principles'
type Mode = Screen2Mode

// Switching, the lists fade out (and shrink a little toward their lines)
// over SWAP_OUT_MS, then the other mode fades in (.screen-2-swap in index.css)
const SWAP_OUT_MS = 150

const linkView = ({ label, href }: { label: string; href: string }) => (
  <a
    key={href}
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    className='screen-2-link'
  >
    {label}
  </a>
)

// The close button of screen 2, at the bottom centre, where the arrow of the
// portrait was. It pops in only once the screen has settled (.pop in
// index.css) and sits above the layout of the screen (.screen-2), which covers
// the whole screen; while hidden it is inert.
const closeButtonView = (
  settled: boolean,
  onClose: () => void,
  ref?: RefObject<HTMLButtonElement | null>,
) => (
  <button
    ref={ref}
    type='button'
    aria-label='Close'
    title='Close'
    inert={!settled}
    className={`pop corner-button fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 size-9 sm:size-11 cursor-pointer items-center justify-center rounded-full border border-line text-ink-muted hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${settled ? '' : 'pop-hidden'}`}
    onClick={onClose}
  >
    <svg
      viewBox='0 0 24 24'
      className='size-4 sm:size-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      aria-hidden='true'
    >
      <path d='M6 6l12 12M18 6L6 18' />
    </svg>
  </button>
)

// The lines of the other side, unseen and flat, so both sides are as wide
// as the wider one: on a narrow screen each line moves with what is beside
// it as a group, and equal groups put the two lines the same distance
// either side of the middle (.screen-2-sizer in index.css)
const sizerView = (lines: readonly string[]) => (
  <span aria-hidden='true' className='screen-2-sizer'>
    {lines.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </span>
)

// What one side of the screen shows in `mode`: links, or lines of text
const sideView = (
  mode: Mode,
  links: readonly { label: string; href: string }[],
  lines: readonly string[],
  label: string,
): ReactNode =>
  mode === 'links' ? (
    <nav aria-label={label} className='contents'>
      {links.map(linkView)}
    </nav>
  ) : (
    lines.map((line) => <p key={line}>{line}</p>)
  )

// Screen 2: the face fades out, leaving the field of characters
// around it, then screen 2 fades in on that field, with CSS transitions
// timed in portrait/screen-fade.ts. Its layout is the one of rinn7e.com,
// symmetric about its middle point: the name in a square in the middle, a
// line from the top down to it with links at its foot on the right, and the
// same turned round below, a line from it down with links at its head on
// the left (.screen-2 in index.css). It closes only with its button (at the
// bottom centre), or Escape from the keyboard; a click elsewhere does
// nothing. Always in the page, so its text can fade out too;
// while closed it is inert (no focus, no clicks). A component, not a view
// function, for the focus and the Escape key.
export const Screen2 = ({
  phase,
  startMode,
  still,
  overlay,
  onClose,
  onFadeEnd,
}: {
  // Where the switch is (Model.screen); it fades with CSS transitions
  // (portrait/screen-fade.ts), or jumps when `still`
  phase: ScreenState['_tag']
  // What it opens on: the links, or the principles
  startMode: Screen2Mode
  still: boolean
  // Whether the buttons over the page show (Model.overlay)
  overlay: boolean
  onClose: () => void
  // Its fade has finished (the end of an opening switch)
  onFadeEnd: () => void
}) => {
  // Open while it shows or is on its way; settled once it has fully come in
  const open = phase === 'Opening' || phase === 'Screen2'
  const direction = open ? 'opening' : 'closing'
  const close = useRef<HTMLButtonElement>(null)
  // The latest onClose, so a new function on every render does not move the
  // focus again
  const closeNow = useRef(onClose)
  useEffect(() => {
    closeNow.current = onClose
  })

  // Its close button pops in only once screen 2 has fully faded in,
  // and pops out as soon as it starts to close, like the button of the
  // portrait (.pop in index.css); while hidden it is inert. It sits above
  // the layout of the screen (.screen-2), which covers the whole screen
  const settled = phase === 'Screen2'

  // Links or principles: it opens on `startMode`, and the name switches
  // between them. Set while rendering when it opens, as React allows for
  // state that follows the props; closing keeps the mode, so it does not
  // change during the fade out.
  const [mode, setMode] = useState<Mode>(startMode)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setMode(startMode)
  }
  const [swapping, setSwapping] = useState(false)
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(swapTimer.current), [])
  const other = (m: Mode): Mode => (m === 'links' ? 'principles' : 'links')
  // Each switch turns the square a quarter turn clockwise (the name stays
  // upright), adding up, so it keeps turning the same way
  const [turns, setTurns] = useState(0)
  const switchMode = () => {
    if (swapping) return
    setTurns((n) => n + 1)
    const still =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) return setMode(other)
    setSwapping(true)
    swapTimer.current = setTimeout(() => {
      setMode(other)
      setSwapping(false)
    }, SWAP_OUT_MS)
  }
  const swap = `screen-2-swap ${swapping ? 'screen-2-swap-out' : ''}`
  const upLines =
    mode === 'links' ? UP_LINKS.map((l) => l.label) : UP_PRINCIPLES
  const downLines =
    mode === 'links' ? DOWN_LINKS.map((l) => l.label) : DOWN_PRACTICES

  // The name and the links grow a little to their size as they come in;
  // the lines do not, so they stay put and only draw themselves
  const moving = phase === 'Opening' || phase === 'Closing'
  const grow = {
    scale: open ? 1 : 1 - SCREEN_2_GROW,
    ...fadeTransition('screen', direction, 'scale', still),
    willChange: moving ? 'scale' : undefined,
  }
  const line = {
    scale: `1 ${open ? 1 : 0}`,
    ...fadeTransition('lines', direction, 'scale', still),
  }

  // Open: Escape closes it; once settled, focus moves to its close button,
  // when it was opened from the keyboard. After a tap or a click it stays
  // put, as Safari draws a focus ring on a focus moved by script even then.
  const keyboard = useRef(false)
  useEffect(() => {
    const onKeyDown = () => {
      keyboard.current = true
    }
    const onPointerDown = () => {
      keyboard.current = false
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  useEffect(() => {
    if (settled && keyboard.current) close.current?.focus()
  }, [settled])

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='screen-2-title'
      inert={!open}
      className={`screen-2-layer fixed inset-0 z-20 ${open ? 'screen-2-open' : ''} ${phase === 'Screen1' ? 'invisible' : ''}`}
    >
      {closeButtonView(settled && overlay, onClose, close)}
      <div
        className='screen-2'
        style={{
          opacity: open ? 1 : 0,
          ...fadeTransition('screen', direction, 'opacity', still),
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'opacity')
            onFadeEnd()
        }}
      >
        <div className='screen-2-half'>
          <div className='screen-2-side screen-2-spacer' />
          <div className='screen-2-line screen-2-line-top' style={line} />
          <div className='screen-2-side screen-2-links-up' style={grow}>
            <div className={swap}>
              {sideView(mode, UP_LINKS, UP_PRINCIPLES, 'Elsewhere')}
            </div>
            {sizerView(downLines)}
          </div>
        </div>
        <div className='screen-2-name' style={grow}>
          <div
            aria-hidden='true'
            className='screen-2-name-turn'
            style={{ rotate: `${90 * turns}deg` }}
          />
          <h2 id='screen-2-title' className='contents'>
            <button
              type='button'
              aria-pressed={mode === 'principles'}
              // Only once the screen has settled: it lands where the eye
              // was, so a second click on the eye while the screen opens
              // would switch the mode
              inert={!settled}
              title={mode === 'links' ? 'My principles' : 'My links'}
              className='screen-2-name-button'
              onClick={switchMode}
            >
              {'Moremi\nVannak'}
              {/* Its outline, drawn when pointed at: two strokes, mirrored
                  through the middle, one from the top left corner down and
                  along the bottom, the other from the bottom right corner up
                  and along the top, meeting to close the square
                  (.screen-2-name-outline in index.css) */}
              <svg
                aria-hidden='true'
                className='screen-2-name-outline'
                viewBox='0 0 100 100'
                preserveAspectRatio='none'
              >
                <path d='M0.5 0.5 V99.5 H99.5' pathLength={1} />
                <path d='M99.5 99.5 V0.5 H0.5' pathLength={1} />
              </svg>
            </button>
          </h2>
        </div>
        <div className='screen-2-half'>
          <div className='screen-2-side screen-2-links-down' style={grow}>
            <div className={swap}>
              {sideView(mode, DOWN_LINKS, DOWN_PRACTICES, 'Writing')}
            </div>
            {sizerView(upLines)}
          </div>
          <div className='screen-2-line screen-2-line-bottom' style={line} />
          <div className='screen-2-side screen-2-spacer' />
        </div>
      </div>
    </div>
  )
}
