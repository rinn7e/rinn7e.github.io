import { type ReactNode, useEffect, useState } from 'react'

// Draws its children only once mounted in the browser: never in a page
// rendered ahead of time, so the HTML and the first render in the browser
// match and React hydrates it. For what exists only in the browser (the
// debug panel of a local server).
export const ClientOnly = ({ children }: { readonly children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  return isMounted ? children : null
}
