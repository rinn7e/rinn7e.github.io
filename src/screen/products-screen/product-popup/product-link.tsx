import { ExternalLink, Gamepad2, Puzzle } from 'lucide-react'
import React from 'react'

import { type ProductLink } from '@/common/data/product'
import { newTabProps } from '@/common/util'
import { GithubIcon } from '@/component/icon'

// A link of a product: the live app, a browser store, the game or the code,
// each opening in a new tab

const productLinkClass =
  'flex items-center gap-[0.4375rem] rounded-[0.5rem] border border-zinc-300 px-[0.875rem] py-[0.4375rem] text-[0.875rem] text-zinc-900 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-400'

const iconClass = 'size-[1rem] shrink-0'

export const productLinkView = ({ link }: { readonly link: ProductLink }) => {
  switch (link._tag) {
    case 'LiveLink':
      return (
        <a
          key={link.url}
          {...newTabProps}
          href={link.url}
          className={productLinkClass}
        >
          <ExternalLink aria-hidden='true' className={iconClass} />
          {link.label}
        </a>
      )
    case 'ChromeWebStoreLink':
      return (
        <a
          key={link.url}
          {...newTabProps}
          href={link.url}
          className={productLinkClass}
        >
          <Puzzle aria-hidden='true' className={iconClass} />
          Chrome Web Store
        </a>
      )
    case 'FirefoxAddonsLink':
      return (
        <a
          key={link.url}
          {...newTabProps}
          href={link.url}
          className={productLinkClass}
        >
          <Puzzle aria-hidden='true' className={iconClass} />
          Firefox Add-ons
        </a>
      )
    case 'PlayLink':
      return (
        <a
          key={link.url}
          {...newTabProps}
          href={link.url}
          className={productLinkClass}
        >
          <Gamepad2 aria-hidden='true' className={iconClass} />
          Play in the browser
        </a>
      )
    case 'SourceLink':
      return (
        <a
          key={link.url}
          {...newTabProps}
          href={link.url}
          className={productLinkClass}
        >
          <GithubIcon className={iconClass} />
          Source
        </a>
      )
  }
}
