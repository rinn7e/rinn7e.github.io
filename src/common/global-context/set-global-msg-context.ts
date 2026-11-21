import { createContext } from 'react'
import type { Dispatcher } from 'tea-cup-fp'

import type { NavigationMsg } from '@/common/type/destination'

// Carries only the root `NavigationMsg` case, so shared components (e.g.
// `Link`) never depend on the root `Msg`; the root `dispatch` is assignable
// to it as-is.
export type GlobalNavigationMsg = {
  readonly _tag: 'NavigationMsg'
  readonly subMsg: NavigationMsg
}

// No sensible default dispatcher exists; the provider always supplies the real one
export const SetGlobalMsgContext = createContext<
  Dispatcher<GlobalNavigationMsg>
>(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  null as any,
)
SetGlobalMsgContext.displayName = 'SetGlobalMsgContext'
