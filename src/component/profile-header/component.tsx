import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import React, { memo } from 'react'

import { type Product, productList } from '@/common/data/product'
import { newTabProps } from '@/common/util'
import { GithubIcon, LinkedinIcon } from '@/component/icon'

import { highlightBarView } from './highlight-bar'
import { tabBarView } from './tab-bar'
import { type Props, PropsEq } from './type'

// The profile at the top of every screen: the avatar and the name, the
// counts of the products and two links, the highlights (the product
// categories, each a link to the cards of its category) and the tabs.
// Sized after a profile page: a 680px header in a page with up to 1457px
// of content. A memo: it draws again only when its `HeaderScreen` changes
// (the tab, the category or the side of the cards).

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
  <span className='text-[0.75rem] leading-[1.125rem] whitespace-nowrap lg:text-[0.875rem]'>
    <span className='font-semibold'>{count}</span> {label}
  </span>
)

const profileButtonClass =
  'flex h-[2.5rem] flex-1 items-center justify-center gap-[0.5rem] rounded-[0.75rem] bg-[#f0f2f5] text-[0.8125rem] font-semibold lg:h-[2.75rem] lg:text-[0.875rem] text-[#0c1014] transition-colors hover:bg-[#e3e6ea] dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700'

const ProfileHeader = ({ headerScreen, dispatch }: Props) => (
  <div className='flex w-full flex-col items-center'>
    <header className='flex w-full max-w-[42.5rem] flex-col gap-[1.5rem] pt-[1rem] lg:pt-[1.9375rem]'>
      {/* Mirrored around the photo on the centre axis: the role and counts
            on its left, aligned toward it, and the name on its right */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-[1rem] lg:gap-[1.75rem]'>
        <div className='flex min-w-0 flex-col items-end text-right'>
          <p className='text-[0.75rem] leading-[1.125rem] text-[#6a717a] lg:text-[0.875rem] dark:text-zinc-400'>
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
    {highlightBarView({
      selected:
        headerScreen._tag === 'ProductsHeader' ? headerScreen.category : O.none,
    })}
    {tabBarView({
      headerScreen,
      onToggleFlip: () => dispatch({ _tag: 'ToggleFlipAll' }),
    })}
  </div>
)

export const ProfileHeaderMemo = memo(ProfileHeader, PropsEq.equals)
