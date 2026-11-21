import type React from 'react'

import { CLOSE_MS, type OpenPhase, RETURN_MS, SPIN_MS } from './type'

// How each part of the popup looks in each phase of its animation

// Where the card on the panel is drawn in each phase. The numbers come from
// the measures of the model, so they go through `style`: the one runtime
// value of this view that a class cannot hold.
export const flightStyleOf = (phase: OpenPhase): React.CSSProperties => {
  switch (phase._tag) {
    case 'Measuring':
      return { opacity: 0 }
    case 'Flying': {
      const dx = phase.from.left - phase.to.left
      const dy = phase.from.top - phase.to.top
      const scale = phase.from.width / phase.to.width
      return {
        transformOrigin: 'top left',
        transform: `perspective(900px) translate(${dx}px, ${dy}px) scale(${scale}) rotateY(0deg)`,
      }
    }
    case 'Spinning':
      return {
        transformOrigin: 'top left',
        transform:
          'perspective(900px) translate(0px, 0px) scale(1) rotateY(360deg)',
        transition: `transform ${SPIN_MS}ms cubic-bezier(0.25, 0.9, 0.25, 1)`,
      }
    case 'Shown':
    case 'Closing':
      return {}
    case 'Returning': {
      // Back to its place in the grid, spinning the other way
      const dx = phase.to.left - phase.from.left
      const dy = phase.to.top - phase.from.top
      const scale = phase.to.width / phase.from.width
      return {
        transformOrigin: 'top left',
        transform: `perspective(900px) translate(${dx}px, ${dy}px) scale(${scale}) rotateY(-360deg)`,
        transition: `transform ${RETURN_MS}ms cubic-bezier(0.5, 0, 0.3, 1)`,
      }
    }
    case 'FadingOut':
      return {
        opacity: 0,
        transform: 'scale(0.85)',
        transition: `opacity ${CLOSE_MS}ms ease-in, transform ${CLOSE_MS}ms ease-in`,
      }
  }
}

// The screenshots and the text fade in with the white of the popup, while
// the card is still in flight, one shortly after the other (`delayClass`),
// and fade out first when the panel closes
export const revealClassOf = (phase: OpenPhase, delayClass: string): string => {
  switch (phase._tag) {
    case 'Measuring':
      return 'opacity-0'
    case 'Flying':
    case 'Spinning':
    case 'Shown':
      return `opacity-100 transition-opacity duration-[300ms] ease-out ${delayClass}`
    case 'Closing':
    case 'Returning':
    case 'FadingOut':
      return 'opacity-0 transition-opacity duration-[200ms] ease-in'
  }
}

// The backdrop and the white of the popup fade in with the flight of the
// card, and out while it flies back; the card itself is not faded with them
export const popupLayerClassOf = (phase: OpenPhase): string => {
  switch (phase._tag) {
    case 'Measuring':
      return 'opacity-0'
    case 'Flying':
    case 'Spinning':
    case 'Shown':
      return 'opacity-100 transition-opacity duration-[300ms] ease-out'
    case 'Closing':
    case 'Returning':
    case 'FadingOut':
      return 'opacity-0 transition-opacity duration-[260ms] ease-in'
  }
}
