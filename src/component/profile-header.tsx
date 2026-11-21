import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import { FlipHorizontal2, Grid3x3, UserRound } from 'lucide-react'
import React from 'react'

import {
  type Product,
  type ProductCategory,
  productCategoryList,
  productList,
} from '@/common/data/product'
import {
  type Screen,
  aboutDestination,
  destinationOfScreen,
  productsScreen,
} from '@/common/type/destination'
import { newTabProps } from '@/common/util'

import { categoryIconView, categoryLabelOf } from './category'
import { GithubIcon, LinkedinIcon } from './icon'
import { Link } from './link'

// The profile at the top of every screen: the avatar and the name, the
// counts of the products, a short bio and two links, the highlights (the
// product categories, each a link to the cards of its category) and the tabs
// (the products and About). Sized after a profile page: a 680px header in a
// page with up to 1457px of content.

const countOf = (isCounted: (product: Product) => boolean): number =>
  pipe(productList, RA.filter(isCounted)).length

const liveCount = countOf((product) =>
  pipe(
    product.linkList,
    RA.exists((link) => link._tag === 'LiveLink' || link._tag === 'PlayLink'),
  ),
)

const storeCount = pipe(
  productList,
  RA.chain((product) => product.linkList),
  RA.filter(
    (link) =>
      link._tag === 'ChromeWebStoreLink' || link._tag === 'FirefoxAddonsLink',
  ),
).length

const statView = ({
  count,
  label,
}: {
  readonly count: number
  readonly label: string
}) => (
  <span className='text-[0.875rem] leading-[1.125rem]'>
    <span className='font-semibold'>{count}</span> {label}
  </span>
)

const profileButtonClass =
  'flex h-[2.75rem] flex-1 items-center justify-center gap-[0.5rem] rounded-[0.75rem] bg-[#f0f2f5] text-[0.875rem] font-semibold text-[#0c1014] transition-colors hover:bg-[#e3e6ea] dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700'

const selectedCategoryOf = (screen: Screen): Option<ProductCategory> =>
  screen._tag === 'ProductsScreen' ? screen.category : O.none

// A highlight: a ring around the icon of a category, its name under it. It
// links to the cards of the category, or back to every card when it is the
// one selected.
const highlightView = ({
  category,
  isSelected,
}: {
  readonly category: ProductCategory
  readonly isSelected: boolean
}) => (
  <li key={category} className='flex w-[5.3125rem] shrink-0 justify-center'>
    <Link
      destination={destinationOfScreen(
        productsScreen(O.none, isSelected ? O.none : O.some(category)),
      )}
      aria-current={isSelected ? 'true' : undefined}
      className='flex flex-col items-center gap-[0.9375rem]'
    >
      <span
        className={[
          'flex size-[5.4375rem] items-center justify-center rounded-full border-[2px] transition-colors',
          isSelected
            ? 'border-[#0c1014] dark:border-zinc-50'
            : 'border-[#dbdfe4] hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
        ].join(' ')}
      >
        <span className='flex size-[4.5rem] items-center justify-center rounded-full bg-[#f0f2f5] text-[#0c1014] dark:bg-zinc-800 dark:text-zinc-50'>
          {categoryIconView({ category, className: 'size-[1.875rem]' })}
        </span>
      </span>
      <span className='w-full truncate text-center text-[0.75rem] leading-[1rem] font-semibold'>
        {categoryLabelOf(category)}
      </span>
    </Link>
  </li>
)

// The button at the end of the tabs that turns every card over to its back
// and again, shown with the cards only
export type FlipControl = {
  readonly isFlipped: boolean
  readonly onToggle: () => void
}

const flipButtonView = ({ isFlipped, onToggle }: FlipControl) => (
  <button
    type='button'
    aria-pressed={isFlipped}
    aria-label={isFlipped ? 'Show the fronts of the cards' : 'Flip the cards'}
    title={isFlipped ? 'Show the fronts of the cards' : 'Flip the cards'}
    className='absolute right-[0] bottom-[0.375rem] flex h-[2rem] items-center gap-[0.375rem] rounded-[0.5rem] px-[0.5rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase transition-colors hover:bg-[#f0f2f5] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
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

export const profileHeaderView = ({
  screen,
  flipControl,
}: {
  readonly screen: Screen
  readonly flipControl: Option<FlipControl>
}) => {
  const selected = selectedCategoryOf(screen)
  return (
    <div className='flex w-full flex-col items-center'>
      <header className='flex w-full max-w-[42.5rem] flex-col gap-[1.5rem] pt-[1rem] lg:pt-[1.9375rem]'>
        {/* Mirrored around the photo on the centre axis: the role and counts
            on its left, aligned toward it, and the name on its right */}
        <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-[1rem] lg:gap-[1.75rem]'>
          <div className='flex min-w-0 flex-col items-end text-right'>
            <p className='text-[0.8125rem] leading-[1.125rem] text-[#6a717a] lg:text-[0.875rem] dark:text-zinc-400'>
              Software engineer
            </p>
            <div className='flex flex-col items-end gap-y-[0.125rem] pt-[0.375rem] lg:flex-row lg:flex-wrap lg:justify-end lg:gap-x-[1rem]'>
              {statView({
                count: productList.length,
                label: 'open-source works',
              })}
              {statView({ count: liveCount, label: 'live' })}
              {statView({ count: storeCount, label: 'in stores' })}
            </div>
          </div>
          <img
            src='/avatar.webp'
            alt='Moremi Vannak'
            width={150}
            height={150}
            className='size-[5.375rem] rounded-full object-cover lg:size-[9.375rem]'
          />
          <div className='flex min-w-0 flex-col items-start text-left'>
            <h1 className='text-[1.125rem] leading-[1.5rem] font-bold lg:text-[1.5rem] lg:leading-[1.875rem]'>
              rinn7e
            </h1>
            <p className='pt-[0.25rem] text-[0.8125rem] leading-[1.125rem] lg:pt-[0.375rem] lg:text-[0.875rem]'>
              Moremi Vannak
            </p>
          </div>
        </div>
        <div className='flex gap-[0.5rem]'>
          {/* GitHub first and LinkedIn second, as on the About tab */}
          <a
            {...newTabProps}
            href='https://github.com/rinn7e'
            className={profileButtonClass}
          >
            <GithubIcon className='size-[1rem]' />
            GitHub
          </a>
          <a
            {...newTabProps}
            href='https://www.linkedin.com/in/moremi-vannak/'
            className={profileButtonClass}
          >
            <LinkedinIcon className='size-[1rem]' />
            LinkedIn
          </a>
        </div>
      </header>
      {/* The highlights are centred, and scroll sideways when the screen is
          narrower (`safe center` keeps the first one reachable) */}
      <nav
        aria-label='Categories'
        className='w-full max-w-[42.5rem] [scrollbar-width:none] overflow-x-auto pt-[1.375rem] pb-[2px] lg:pt-[2.875rem]'
      >
        <ul className='flex [justify-content:safe_center] gap-[0.75rem] px-[0.875rem]'>
          {pipe(
            productCategoryList,
            RA.map((category) =>
              highlightView({
                category,
                isSelected: O.elem(S.Eq)(category, selected),
              }),
            ),
          )}
        </ul>
      </nav>
      <nav
        aria-label='Sections'
        className='relative flex w-full justify-center gap-[1.5rem] border-b border-[#dbdfe4] pt-[1.625rem] lg:gap-[3.75rem] dark:border-zinc-800'
      >
        <Link
          destination={destinationOfScreen(productsScreen())}
          aria-current={screen._tag === 'ProductsScreen' ? 'page' : undefined}
          className={tabClass(screen._tag === 'ProductsScreen')}
        >
          <Grid3x3 aria-hidden='true' className='size-[1rem]' />
          Open-source work
        </Link>
        <Link
          destination={aboutDestination()}
          aria-current={screen._tag === 'AboutScreen' ? 'page' : undefined}
          className={tabClass(screen._tag === 'AboutScreen')}
        >
          <UserRound aria-hidden='true' className='size-[1rem]' />
          About
        </Link>
        {pipe(flipControl, O.map(flipButtonView), O.toNullable)}
      </nav>
    </div>
  )
}
