import { createRoot } from 'react-dom/client'

import './asset/index.css'
import { startDebugOverlay } from './debug-overlay'
import { portraitDark, portraitLight } from './portrait/portrait'
import { AppProgram } from './program'
import { applyTheme, initialTheme } from './theme'

// Before the first render, so the page never flashes the other theme
applyTheme(initialTheme())

// An image the page does not show yet (the other theme, the sprite sheet of
// a blink) would only start loading when it is needed, leaving part of the
// portrait blank for a moment. Load them all up front.
for (const { photo, hair, eyes } of [portraitLight, portraitDark]) {
  const sprites = [eyes.style1.sprite, eyes.style2.sprite]
  for (const src of [photo, hair.sprite, ...sprites]) new Image().src = src
}

// With ?debug in the address, a report over the page (debug-overlay.ts)
if (new URLSearchParams(location.search).has('debug')) startDebugOverlay()

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<AppProgram />)
}
