// A small report over the page, only with ?debug in the address, to see
// what happens on a phone when the page seems frozen: the phase of the
// switch, whether its buttons can be pressed, how long the main thread was
// stuck, the frames per second, the last taps and transitions, and errors.
// Plain DOM outside React, so it goes on reporting even if React stalls; it
// takes no taps (pointer-events: none).

const EVENTS_KEPT = 8

export const startDebugOverlay = (): void => {
  const box = document.createElement('pre')
  box.style.cssText =
    'position:fixed;left:4px;right:4px;top:4px;z-index:2147483647;margin:0;padding:6px;' +
    'background:rgba(255,235,59,0.92);color:#000;font:11px/1.35 ui-monospace,monospace;' +
    'white-space:pre-wrap;pointer-events:none;border-radius:6px'
  document.body.appendChild(box)

  const start = performance.now()
  const now = () => Math.round(performance.now() - start)
  const events: string[] = []
  const errors: string[] = []
  const log = (line: string) => {
    events.unshift(`${(now() / 1000).toFixed(2)}s ${line}`)
    events.length = Math.min(events.length, EVENTS_KEPT)
  }
  const describe = (target: EventTarget | null): string => {
    if (!(target instanceof Element)) return '?'
    const button = target.closest('button, a')
    if (button) return (button as HTMLElement).title || button.tagName
    return target.classList[0] ?? target.tagName.toLowerCase()
  }

  document.addEventListener(
    'pointerdown',
    (e) => log(`down ${describe(e.target)}`),
    true,
  )
  document.addEventListener(
    'click',
    (e) =>
      log(
        `click ${describe(e.target)}${e.defaultPrevented ? ' (stopped)' : ''}`,
      ),
    true,
  )
  document.addEventListener(
    'transitionend',
    (e) => {
      if (e.propertyName === 'opacity' && e.target instanceof Element) {
        const name = e.target.classList[0]
        if (name === 'portrait' || name === 'screen-2') log(`end ${name}`)
      }
    },
    true,
  )
  addEventListener('error', (e) => errors.push(e.message))
  addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)))

  // The main thread: a tick every 100ms, and the longest gap between two
  // (a gap far above 100ms means the thread was stuck that long)
  let lastTick = performance.now()
  let worstGap = 0
  let worstAt = 0
  setInterval(() => {
    const t = performance.now()
    const gap = t - lastTick - 100
    if (gap > worstGap) {
      worstGap = gap
      worstAt = now()
    }
    lastTick = t
  }, 100)

  // Frames per second, over the last second
  let frames = 0
  let fps = 0
  const count = () => {
    frames += 1
    requestAnimationFrame(count)
  }
  requestAnimationFrame(count)
  setInterval(() => {
    fps = frames
    frames = 0
  }, 1000)

  const state = (): string => {
    const layer = document.querySelector('.screen-2-layer')
    const face = document.querySelector('.portrait')
    const pressable = (title: string) => {
      const b = document.querySelector<HTMLElement>(`button[title="${title}"]`)
      return b && !b.inert && !b.classList.contains('pop-hidden') ? 'on' : 'off'
    }
    const open = layer?.classList.contains('screen-2-open') ? 'open' : 'closed'
    const shown = layer?.classList.contains('invisible') ? 'hidden' : 'shown'
    const faceOpacity = face
      ? Number(getComputedStyle(face).opacity).toFixed(2)
      : '?'
    return `screen 2 ${open}/${shown}  face ${faceOpacity}  X ${pressable('Close')}  arrow ${pressable('About me')}`
  }

  setInterval(() => {
    box.textContent =
      `t ${(now() / 1000).toFixed(1)}s  fps ${fps}  stuck max ${Math.round(worstGap)}ms at ${(worstAt / 1000).toFixed(1)}s\n` +
      `${state()}\n` +
      events.join('\n') +
      (errors.length > 0 ? `\nERRORS ${errors.slice(-2).join(' | ')}` : '')
  }, 250)
}
