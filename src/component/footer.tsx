import { aboutDestination, privacyDestination } from '@/common/type/destination'
import { newTabProps } from '@/common/util'

import { Link } from './link'

const footerLinkClass = 'hover:underline'

// A quiet row of small links at the bottom of the page
export const footerView = () => (
  <footer className='flex w-full flex-col items-center gap-[0.75rem] px-[1rem] pt-[1.5rem] pb-[2.5rem] text-center text-[0.75rem] leading-[1rem] text-[#6a717a] dark:text-zinc-400'>
    <nav
      aria-label='Footer'
      className='flex flex-wrap justify-center gap-x-[1rem] gap-y-[0.5rem]'
    >
      <Link destination={aboutDestination()} className={footerLinkClass}>
        About
      </Link>
      <a
        {...newTabProps}
        href='https://github.com/rinn7e'
        className={footerLinkClass}
      >
        GitHub
      </a>
      <a
        {...newTabProps}
        href='https://www.linkedin.com/in/moremi-vannak/'
        className={footerLinkClass}
      >
        LinkedIn
      </a>
      <a
        {...newTabProps}
        href='https://github.com/rinn7e/rinn7e.github.io'
        className={footerLinkClass}
      >
        Source of this site
      </a>
      <Link destination={privacyDestination()} className={footerLinkClass}>
        Privacy
      </Link>
    </nav>
    <p>All the work here is open source.</p>
  </footer>
)
