// The debug panel shows in development and on a local server (`vite`,
// `vite preview`), never on the live site
export const IS_DEBUG_PANEL_ENABLED: boolean =
  import.meta.env.DEV ||
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
