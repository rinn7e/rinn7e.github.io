import type React from 'react'

// The tilt and shine follow the pointer. They are presentation only, like a
// hover color, so they live in CSS variables, not in the model: nothing
// waits for them.
const MAX_TILT_DEG = 16

export const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === 'touch') {
    // A finger scrolls the page; the card stays flat
  } else {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    element.dataset.tracking = 'true'
    element.style.setProperty('--card-ry', `${(x - 0.5) * MAX_TILT_DEG}deg`)
    element.style.setProperty('--card-rx', `${(0.5 - y) * MAX_TILT_DEG}deg`)
    element.style.setProperty('--card-mx', `${x * 100}%`)
    element.style.setProperty('--card-my', `${y * 100}%`)
    element.style.setProperty('--card-nx', `${(x - 0.5) * 2}`)
    element.style.setProperty('--card-ny', `${(y - 0.5) * 2}`)
    element.style.setProperty('--card-hover', '1')
  }
}

export const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
  const element = event.currentTarget
  element.dataset.tracking = 'false'
  ;[
    '--card-rx',
    '--card-ry',
    '--card-mx',
    '--card-my',
    '--card-nx',
    '--card-ny',
    '--card-hover',
  ].forEach((name) => element.style.removeProperty(name))
}
