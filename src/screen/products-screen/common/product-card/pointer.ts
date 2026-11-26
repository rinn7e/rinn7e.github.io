import type React from 'react'

// The tilt and shine follow the pointer. They are presentation only, like a
// hover color, so they live in CSS variables, not in the model: nothing
// waits for them.
const MAX_TILT_DEG = 16

// A layer over a card (its quick link) carries this attribute: the pointer
// on it still tilts the card under it
export const cardLayerAttr = 'data-card-layer'

const tiltOn = (element: HTMLElement, event: React.PointerEvent) => {
  if (event.pointerType === 'touch') {
    // A finger scrolls the page; the card stays flat
  } else {
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

const flatten = (element: HTMLElement) => {
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

// Whether `target` is within the layer over the card of `tracker`, or within
// the card itself
const isLayerOf = (target: EventTarget | null, tracker: HTMLElement) =>
  target instanceof Element &&
  (tracker.contains(target) ||
    (target.closest(`[${cardLayerAttr}]`)?.parentElement?.contains(tracker) ??
      false))

export const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  tiltOn(event.currentTarget, event)
}

// The pointer left the card: it flattens, unless it went onto its layer,
// which tilts it on
export const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
  if (!isLayerOf(event.relatedTarget, event.currentTarget)) {
    flatten(event.currentTarget)
  }
}

// The tracker of the card under a layer: the box with `data-tracked` in its
// sibling
const trackerUnder = (layer: HTMLElement): HTMLElement | null =>
  layer.parentElement?.querySelector<HTMLElement>('[data-tracked]') ?? null

// On a layer over a card, the pointer tilts the card under it
export const trackPointerThroughLayer = (
  event: React.PointerEvent<HTMLElement>,
) => {
  const tracker = trackerUnder(event.currentTarget)
  if (tracker !== null) {
    tiltOn(tracker, event)
  }
}

export const releasePointerThroughLayer = (
  event: React.PointerEvent<HTMLElement>,
) => {
  const tracker = trackerUnder(event.currentTarget)
  if (tracker !== null && !isLayerOf(event.relatedTarget, tracker)) {
    flatten(tracker)
  }
}
