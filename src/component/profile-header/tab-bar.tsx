import * as O from 'fp-ts/Option'
import {
  BookOpenText,
  FlipHorizontal2,
  Grid3x3,
  UserRound,
  X,
} from 'lucide-react'
import React from 'react'

import {
  aboutDestination,
  blogDestination,
  destinationOfScreen,
  productsScreen,
} from '@/common/type/destination'
import { Link } from '@/component/link'

import { type HeaderScreen } from './type'

// The two quiet buttons at the ends of the tabs, mirrored around the axis:
// Flip on the left, Clear filter on the right
const tabEndButtonClass =
  'absolute bottom-[0.375rem] flex h-[2rem] items-center gap-[0.375rem] rounded-[0.5rem] px-[0.5rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase transition-colors hover:bg-[#f0f2f5] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'

// The button at the left end of the tabs that turns every card over to its
// back and again, shown with the cards only
const flipButtonView = ({
  isFlipped,
  onToggle,
}: {
  readonly isFlipped: boolean
  readonly onToggle: () => void
}) => (
  <button
    type='button'
    aria-pressed={isFlipped}
    aria-label={isFlipped ? 'Show the fronts of the cards' : 'Flip the cards'}
    title={isFlipped ? 'Show the fronts of the cards' : 'Flip the cards'}
    className={`${tabEndButtonClass} left-[0]`}
    onClick={onToggle}
  >
    <FlipHorizontal2 aria-hidden='true' className='size-[1rem]' />
    <span className='hidden lg:inline'>{isFlipped ? 'Unflip' : 'Flip'}</span>
  </button>
)

const tabClass = (isCurrent: boolean): string =>
  [
    'flex h-[2.75rem] items-center gap-[0.375rem] border-b-[2px] px-[0.25rem] text-[0.75rem] font-semibold tracking-[0.06em] uppercase transition-colors',
    isCurrent
      ? 'border-[#0c1014] text-[#0c1014] dark:border-zinc-50 dark:text-zinc-50'
      : 'border-transparent text-[#6a717a] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:text-zinc-50',
  ].join(' ')

// The icon of a tab, on a desktop only: on a phone the three tabs fill the
// row, and their labels alone leave room for Flip and Clear filter at the ends
const tabIconClass = 'hidden size-[1rem] lg:block'

// The tabs (the products, the blog and About) on the centre axis, with Flip at the
// left end and Clear filter at the right end (while a category is picked),
// both with the cards only
export const tabBarView = ({
  headerScreen,
  onToggleFlip,
}: {
  readonly headerScreen: HeaderScreen
  readonly onToggleFlip: () => void
}) => (
  <nav
    aria-label='Sections'
    className='relative flex w-full justify-center gap-[0.5rem] border-b border-[#dbdfe4] pt-[1.625rem] lg:gap-[3.75rem] dark:border-zinc-800'
  >
    <Link
      destination={destinationOfScreen(productsScreen())}
      aria-current={headerScreen._tag === 'ProductsHeader' ? 'page' : undefined}
      className={tabClass(headerScreen._tag === 'ProductsHeader')}
    >
      <Grid3x3 aria-hidden='true' className={tabIconClass} />
      Open-source work
    </Link>
    <Link
      destination={blogDestination()}
      aria-current={headerScreen._tag === 'BlogHeader' ? 'page' : undefined}
      className={tabClass(
        headerScreen._tag === 'BlogHeader' ||
          headerScreen._tag === 'BlogPostHeader',
      )}
    >
      <BookOpenText aria-hidden='true' className={tabIconClass} />
      Blog
    </Link>
    <Link
      destination={aboutDestination()}
      aria-current={headerScreen._tag === 'AboutHeader' ? 'page' : undefined}
      className={tabClass(headerScreen._tag === 'AboutHeader')}
    >
      <UserRound aria-hidden='true' className={tabIconClass} />
      About
    </Link>
    {headerScreen._tag === 'ProductsHeader' ? (
      <>
        {flipButtonView({
          isFlipped: headerScreen.isFlipped,
          onToggle: onToggleFlip,
        })}
        {O.isSome(headerScreen.category) ? (
          <Link
            destination={destinationOfScreen(productsScreen())}
            aria-label='Clear the filter'
            className={`${tabEndButtonClass} right-[0]`}
          >
            <span className='hidden lg:inline'>Clear filter</span>
            <X aria-hidden='true' className='size-[1rem]' />
          </Link>
        ) : null}
      </>
    ) : null}
  </nav>
)
