import React, { useEffect, useRef, useState } from 'react'
import type { Dispatcher } from 'tea-cup-fp'

import {
  type GlobalNavigationMsg,
  SetGlobalMsgContext,
} from './set-global-msg-context'

// Hands the shared components (e.g. `Link`) one dispatcher that never
// changes. tea-cup makes a new `dispatch` on every draw, and a new context
// value would draw every `Link` again, even inside a memo; this one only
// forwards to the latest `dispatch`.
export const GlobalMsgProvider = ({
  dispatch,
  children,
}: {
  readonly dispatch: Dispatcher<GlobalNavigationMsg>
  readonly children: React.ReactNode
}) => {
  const latest = useRef(dispatch)
  useEffect(() => {
    latest.current = dispatch
  })
  const [stable] = useState<Dispatcher<GlobalNavigationMsg>>(
    () => (msg: GlobalNavigationMsg) => latest.current(msg),
  )
  return <SetGlobalMsgContext value={stable}>{children}</SetGlobalMsgContext>
}
