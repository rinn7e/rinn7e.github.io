import { useEffect, useState } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { portraitDark, portraitLight } from './portrait/portrait'
import { PortraitArt } from './portrait/portrait-art'
import { coverAt } from './portrait/screen-fade'
import { useScreenTransition } from './portrait/screen-transition'
import { Screen2, type Screen2Mode } from './screen-2'
import { type ThemeChoice, nextThemeChoice } from './theme'
import { type Model, type Msg } from './type'
import { themeOf } from './update'

// The home page has two screens on one field of characters. Screen 1 is the
// portrait (PortraitArt); screen 2 shows the links (screen-2.tsx). On both:
// the link to the source on GitHub in the bottom left corner, and the theme
// switch (auto, light, dark) in the bottom right corner.
// A click on an eye, once the red eye is on, or on the arrow button at the
// bottom centre, at once, fades the face out, leaving the field of
// characters around it, and screen 2 in on that field. The debug controls
// in the top right corner (PortraitArt) show in the dev build only.

export interface AppProps {
  model: Model
  dispatch: Dispatcher<Msg>
}

// The icon of each theme choice: lucide's SunMoon, Sun and Moon
const THEME_ICON_PATHS: Record<ThemeChoice, readonly string[]> = {
  auto: [
    'M12 2v2',
    'M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715',
    'M16 12a4 4 0 0 0-4-4',
    'm19 5-1.256 1.256',
    'M20 12h2',
  ],
  light: [
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
  ],
  dark: [
    'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401',
  ],
}

const THEME_LABELS: Record<ThemeChoice, string> = {
  auto: 'Auto theme',
  light: 'Light theme',
  dark: 'Dark theme',
}

const themeIconView = (choice: ThemeChoice) => (
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
    {choice === 'light' && <circle cx='12' cy='12' r='4' />}
    {THEME_ICON_PATHS[choice].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
)

// Shows the theme choice in use (auto follows the OS setting); a press moves
// to the next: auto, light, dark, then auto again. A control for visitors, so it sits in the bottom right corner, apart from
// the debug controls in the top right corner (PortraitArt), on every screen:
// above screen 2 too, so a press there switches the theme rather than
// closing it. Hidden with the other buttons over the page (Model.overlay),
// popping out (.pop in index.css); while hidden it is inert.
const themeButtonView = (model: Model, dispatch: Dispatcher<Msg>) => {
  const choice = model.themeChoice
  const next = nextThemeChoice(choice)
  return (
    <button
      type='button'
      aria-label={`${THEME_LABELS[choice]}; switch to ${THEME_LABELS[next].toLowerCase()}`}
      title={THEME_LABELS[choice]}
      inert={!model.overlay}
      className={`pop corner-button fixed right-4 bottom-4 z-30 flex size-9 sm:size-11 cursor-pointer items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${model.overlay ? '' : 'pop-hidden'}`}
      onClick={() => dispatch({ _tag: 'CycleTheme' })}
    >
      {themeIconView(choice)}
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
// theme switch, so it mirrors it in the bottom left corner, on every screen,
// and hides with it.
const githubButtonView = (shown: boolean) => (
  <a
    href='https://github.com/rinn7e/rinn7e.github.io'
    target='_blank'
    rel='noopener noreferrer'
    aria-label='The source of this website on GitHub'
    title='GitHub'
    inert={!shown}
    className={`pop corner-button fixed bottom-4 left-4 z-30 flex size-9 sm:size-11 cursor-pointer items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${shown ? '' : 'pop-hidden'}`}
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
  const portrait = themeOf(model) === 'dark' ? portraitDark : portraitLight
  // Any press, a click or a tap on empty space or a button, shows the buttons
  // over the page and restarts the time they stay; it never hides them. A
  // capture listener on the document, as iOS Safari sends no click to a
  // handler on <main> for a tap on plain text. Hidden buttons take no focus,
  // so Tab shows them for the keyboard.
  useEffect(() => {
    const show = () => dispatch({ _tag: 'ShowOverlay' })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') show()
    }
    document.addEventListener('pointerdown', show, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', show, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch])
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
        overlay={model.overlay}
      />
      {githubButtonView(model.overlay)}
      {themeButtonView(model, dispatch)}
      <Screen2
        open={model.screen2}
        startMode={startMode}
        t={t}
        overlay={model.overlay}
        onClose={() => dispatch({ _tag: 'CloseScreen2' })}
      />
    </main>
  )
}
