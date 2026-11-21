import type React from 'react'

// An outside link opens in a new tab, so the site stays open behind it;
// `noopener` keeps the new page from reaching back to this one
export const newTabProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
} satisfies React.AnchorHTMLAttributes<HTMLAnchorElement>
