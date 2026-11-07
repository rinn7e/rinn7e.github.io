import { useState } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { portraitDark, portraitLight } from './portrait/portrait'
import { PortraitArt } from './portrait/portrait-art'
import { coverAt } from './portrait/screen-fade'
import { useScreenTransition } from './portrait/screen-transition'
import { Screen2, type Screen2Mode } from './screen-2'
import { type Model, type Msg } from './type'

// The home page has two screens on one field of characters. Screen 1 is the
// portrait (PortraitArt); screen 2 shows the links (screen-2.tsx). On both,
// in a row at the bottom centre: the link to the source on GitHub, the
// button of the screen (the arrow, or close), and the light or dark switch.
// A click on an eye, once the red eye is on, or on the arrow button at the
// bottom centre, at once, fades the face out, leaving the field of
// characters around it, and screen 2 in on that field. The debug controls
// in the top right corner (PortraitArt) show in the dev build only.

export interface AppProps {
  model: Model
  dispatch: Dispatcher<Msg>
}

const sunIconView = () => (
  <svg
    viewBox='0 0 24 24'
    className='size-4 sm:size-5'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.75'
    strokeLinecap='round'
    aria-hidden='true'
  >
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
  </svg>
)

const moonIconView = () => (
  <svg
    viewBox='0 0 24 24'
    className='size-4 sm:size-5'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.75'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' />
  </svg>
)

// Shows what a press switches to: the moon in light mode, the sun in dark.
// A control for visitors, so it sits in the bottom row, right of the button
// of the screen (.beside-centre-right in index.css), apart from the debug
// controls in the top right corner (PortraitArt), on every screen:
// above screen 2 too, so a press there switches the theme rather
// than closing it.
const themeButtonView = (model: Model, dispatch: Dispatcher<Msg>) => {
  const toDark = model.theme === 'light'
  return (
    <button
      type='button'
      aria-label={toDark ? 'Switch to dark mode' : 'Switch to light mode'}
      title={toDark ? 'Dark mode' : 'Light mode'}
      className='corner-button beside-centre-right fixed bottom-4 z-30 flex size-9 sm:size-11 cursor-pointer items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'
      onClick={() => dispatch({ _tag: 'ToggleTheme' })}
    >
      {toDark ? moonIconView() : sunIconView()}
    </button>
  )
}

// The GitHub mark, filled
const githubIconView = () => (
  <svg
    viewBox='0 0 24 24'
    className='size-4 sm:size-5'
    fill='currentColor'
    aria-hidden='true'
  >
    <path d='M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z' />
  </svg>
)

// The source of this website, on GitHub. A control for visitors like the
// theme switch, so it mirrors it left of the button of the screen, on every
// screen.
const githubButtonView = () => (
  <a
    href='https://github.com/rinn7e/rinn7e.github.io'
    target='_blank'
    rel='noopener noreferrer'
    aria-label='The source of this website on GitHub'
    title='GitHub'
    className='corner-button beside-centre-left fixed bottom-4 z-30 flex size-9 sm:size-11 cursor-pointer items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'
  >
    {githubIconView()}
  </a>
)

// The portrait of the current theme: the grid, coloured by the photo behind
// it (see .portrait in index.css). The other photo is loaded up front in
// root.tsx, so switching is instant.
export const App = ({ model, dispatch }: AppProps) => {
  const { t } = useScreenTransition(model.screen2)
  // What screen 2 opens on: the principles from an eye, the links
  // from the arrow button
  const [startMode, setStartMode] = useState<Screen2Mode>('links')
  const portrait = model.theme === 'dark' ? portraitDark : portraitLight
  return (
    <main className='portrait-room flex min-h-dvh items-center justify-center px-4'>
      <PortraitArt
        portrait={portrait}
        onOpen={(mode) => {
          setStartMode(mode)
          dispatch({ _tag: 'OpenScreen2' })
        }}
        hold={model.screen2 || t > 0}
        fade={coverAt(t)}
        redEyeStyle={model.redEyeStyle}
        onRedEyeStyle={(style) => dispatch({ _tag: 'SetRedEyeStyle', style })}
      />
      {githubButtonView()}
      {themeButtonView(model, dispatch)}
      <Screen2
        open={model.screen2}
        startMode={startMode}
        t={t}
        onClose={() => dispatch({ _tag: 'CloseScreen2' })}
      />
    </main>
  )
}
