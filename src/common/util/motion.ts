// Read when the visitor acts, so a change of the setting counts at once
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
