import { init } from '@/update'

import { locationOf } from './location'

// The time every test boots at: noon on 26 Nov 2026
export const BOOT_NOW = new Date(2026, 10, 26, 12).getTime()

// The model the app boots with on the page at `path` of rinn7e.com
export const bootOn = (path: string) =>
  init(locationOf(`https://rinn7e.com${path}`), BOOT_NOW)[0]
