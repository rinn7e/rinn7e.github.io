import React, { useContext } from 'react'

import { SetGlobalMsgContext } from '@/common/global-context'
import { type Destination, toUrlString } from '@/common/type/destination'
import { pushEntryOfLink } from '@/common/util'

// Not memoized: `children` is arbitrary JSX, which has no meaningful Eq
export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  readonly destination: Destination
  readonly children: React.ReactNode
}

// A real anchor: a plain left click navigates in the app, a click with a
// modifier key or another button keeps the browser's behaviour (a new tab,
// copying the link)
export const Link = ({
  destination,
  children,
  onClick,
  ...rest
}: LinkProps) => {
  const setGlobalMsg = useContext(SetGlobalMsgContext)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault()
      pushEntryOfLink(toUrlString(destination))
      setGlobalMsg({
        _tag: 'NavigationMsg',
        subMsg: { _tag: 'Navigate', destination, scrollY: window.scrollY },
      })
    }
  }

  return (
    <a {...rest} href={toUrlString(destination)} onClick={handleClick}>
      {children}
    </a>
  )
}
