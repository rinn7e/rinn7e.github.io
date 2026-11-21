import { init } from '@/update'

import { locationOf } from './location'

// The model the app boots with on the page at `path` of rinn7e.com
export const bootOn = (path: string) =>
  init(locationOf(`https://rinn7e.com${path}`))[0]
