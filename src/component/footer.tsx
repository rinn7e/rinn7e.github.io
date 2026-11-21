import { aboutDestination, defaultDestination } from '@/common/type/destination'

import { centredColumnView } from './layout'
import { Link } from './link'

const footerLinkClass =
  'underline-offset-[0.2em] hover:text-zinc-900 hover:underline dark:hover:text-zinc-50'

export const footerView = () => (
  <footer className='border-t border-zinc-200 pt-[32px] pb-[40px] text-center text-[0.875rem] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'>
    {centredColumnView({
      children: (
        <div className='flex flex-col items-center gap-[12px]'>
          <nav
            aria-label='Footer'
            className='flex flex-wrap justify-center gap-x-[24px] gap-y-[8px]'
          >
            <Link
              destination={defaultDestination()}
              className={footerLinkClass}
            >
              Products
            </Link>
            <Link destination={aboutDestination()} className={footerLinkClass}>
              About
            </Link>
            <a href='https://github.com/rinn7e' className={footerLinkClass}>
              GitHub
            </a>
            <a
              href='https://www.linkedin.com/in/moremi-vannak/'
              className={footerLinkClass}
            >
              LinkedIn
            </a>
            <a href='https://me.rinn7e.com/' className={footerLinkClass}>
              me.rinn7e.com
            </a>
          </nav>
          <p>
            Every product here is open source.{' '}
            <a
              href='https://github.com/rinn7e/rinn7e.github.io'
              className='underline underline-offset-[0.2em] hover:text-zinc-900 dark:hover:text-zinc-50'
            >
              The code of this site
            </a>{' '}
            too.
          </p>
        </div>
      ),
    })}
  </footer>
)
