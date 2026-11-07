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

  // Flags that turn parts off, to find what costs the most: ?debug&nofield
  // hides the field of characters, &noclip draws the portrait in plain grey
  // instead of the photo through the characters
  const flags = new URLSearchParams(location.search)
  const off: string[] = []
  if (flags.has('nofield')) off.push('.backdrop { display: none !important; }')
  if (flags.has('noclip'))
    off.push(
      '.portrait-part, .iris-glow { background: none !important; color: #888 !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; }',
    )
  if (off.length > 0) {
    const style = document.createElement('style')
    style.textContent = off.join('\n')
    document.head.appendChild(style)
  }

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
    'pointerup',
    (e) => log(`up ${describe(e.target)}`),
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
    if (gap > 150) log(`STALL ${Math.round(gap)}ms`)
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

  // &auto=theme clicks the theme button every 3s, &auto=tap presses empty
  // space: the same action again and again with no finger, and the time to
  // the second frame after it (what the page took to answer it)
  const auto = flags.get('auto')
  // &auto=switch presses the arrow, then the close button, again and again,
  // and logs how long each switch took from the press until its button for
  // the way back can be pressed (a switch is 520ms of animation)
  if (auto === 'switch') {
    const pressable = (title: string) => {
      const b = document.querySelector<HTMLElement>(`button[title="${title}"]`)
      return b !== null && !b.inert ? b : null
    }
    let pressedAt = 0
    let waitingFor: string | null = null
    setInterval(() => {
      const t = performance.now()
      if (waitingFor !== null) {
        const back = pressable(waitingFor)
        if (back === null) return
        log(
          `SWITCH to ${waitingFor === 'Close' ? 'screen 2' : 'screen 1'} ${Math.round(t - pressedAt)}ms`,
        )
        waitingFor = null
        return
      }
      if (t - pressedAt < 1500) return
      const arrow = pressable('About me')
      const close = pressable('Close')
      const button = arrow ?? close
      if (button === null) {
        // The buttons are hidden: a press on empty space shows them, as a
        // finger would (its click only reveals, see app.tsx)
        document.body.dispatchEvent(
          new PointerEvent('pointerup', { bubbles: true }),
        )
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return
      }
      pressedAt = t
      waitingFor = button === arrow ? 'Close' : 'About me'
      button.click()
    }, 20)
  }
  if (auto === 'theme' || auto === 'tap') {
    const costs: number[] = []
    setInterval(() => {
      const t0 = performance.now()
      if (auto === 'theme') {
        document.querySelector<HTMLElement>('button[title$="theme"]')?.click()
      } else {
        document.body.dispatchEvent(
          new PointerEvent('pointerup', { bubbles: true }),
        )
      }
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const cost = Math.round(performance.now() - t0)
          costs.push(cost)
          log(
            `AUTO ${auto} ${cost}ms (avg ${Math.round(costs.reduce((a, b) => a + b, 0) / costs.length)})`,
          )
        }),
      )
    }, 3000)
  }

  setInterval(() => {
    box.textContent =
      `t ${(now() / 1000).toFixed(1)}s  fps ${fps}  stuck max ${Math.round(worstGap)}ms at ${(worstAt / 1000).toFixed(1)}s\n` +
      `${state()}\n` +
      events.join('\n') +
      (errors.length > 0 ? `\nERRORS ${errors.slice(-2).join(' | ')}` : '')
  }, 250)
}
