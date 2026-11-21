import {
  type Screen,
  aboutDestination,
  defaultDestination,
} from '@/common/type/destination'

import { centredColumnView } from './layout'
import { Link } from './link'

const navLinkClass = [
  // shared class
  'rounded-[8px] border px-[12px] py-[6px] text-[0.9375rem] transition-colors',
  'hover:border-zinc-300 hover:text-zinc-900',
  'dark:hover:border-zinc-700 dark:hover:text-zinc-50',
].join(' ')

const activeClass =
  'border-zinc-400 text-zinc-900 dark:border-zinc-600 dark:text-zinc-50'
const idleClass = 'border-transparent text-zinc-600 dark:text-zinc-400'

// The top bar: a three-column grid keeps the logo on the exact centre,
// Products on its left and About on its right, each aligned toward the axis
export const headerView = ({ screen }: { readonly screen: Screen }) => (
  <header className='border-b border-zinc-200 dark:border-zinc-800'>
    {centredColumnView({
      children: (
        <nav
          aria-label='Main'
          className='grid h-[64px] grid-cols-[1fr_auto_1fr] items-center gap-[12px]'
        >
          <Link
            destination={defaultDestination()}
            aria-current={screen._tag === 'ProductsScreen' ? 'page' : undefined}
            className={`${navLinkClass} justify-self-end ${screen._tag === 'ProductsScreen' ? activeClass : idleClass}`}
          >
            Products
          </Link>
          <Link
            destination={defaultDestination()}
            aria-label='rinn7e, home'
            className='flex items-center gap-[10px] text-[1.125rem] font-semibold tracking-[0.02em] text-zinc-900 dark:text-zinc-50'
          >
            <img
              src='/favicon.svg'
              alt=''
              width={32}
              height={32}
              className='size-[32px]'
            />
            <span className='hidden min-[400px]:inline'>rinn7e</span>
          </Link>
          <Link
            destination={aboutDestination()}
            aria-current={screen._tag === 'AboutScreen' ? 'page' : undefined}
            className={`${navLinkClass} justify-self-start ${screen._tag === 'AboutScreen' ? activeClass : idleClass}`}
          >
            About
          </Link>
        </nav>
      ),
    })}
  </header>
)
