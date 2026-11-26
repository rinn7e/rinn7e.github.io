// The debug panel shows in development and on a local server (`vite`,
// `vite preview`), never on the live site, nor in a page rendered ahead of
// time in Node, which has no window (the root view draws it in the browser
// only, `ClientOnly`)
export const IS_DEBUG_PANEL_ENABLED: boolean =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname))
