import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import React from 'react'

import { type ProductCategory, shownCategoryList } from '@/common/data/product'
import { destinationOfScreen, productsScreen } from '@/common/type/destination'
import { categoryIconView, categoryLabelOf } from '@/component/category'
import { Link } from '@/component/link'

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
  <li
    key={category}
    className='flex w-[4.25rem] shrink-0 justify-center lg:w-[5.3125rem]'
  >
    <Link
      destination={destinationOfScreen(
        productsScreen(O.none, isSelected ? O.none : O.some(category)),
      )}
      aria-current={isSelected ? 'true' : undefined}
      className='flex flex-col items-center gap-[0.5rem] lg:gap-[0.9375rem]'
    >
      <span
        className={[
          'flex size-[4rem] items-center justify-center rounded-full border-[2px] transition-colors lg:size-[5.4375rem]',
          isSelected
            ? 'border-[#0c1014] dark:border-zinc-50'
            : 'border-[#dbdfe4] hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
        ].join(' ')}
      >
        <span className='flex size-[3.25rem] items-center justify-center rounded-full bg-[#f0f2f5] text-[#0c1014] lg:size-[4.5rem] dark:bg-zinc-800 dark:text-zinc-50'>
          {categoryIconView({
            category,
            className: 'size-[1.375rem] lg:size-[1.875rem]',
          })}
        </span>
      </span>
      <span className='w-full truncate text-center text-[0.75rem] leading-[1rem] font-semibold'>
        {categoryLabelOf(category)}
      </span>
    </Link>
  </li>
)

// The highlights, one per category with a visible card, centred; they scroll sideways when the
// screen is narrower (`safe center` keeps the first one reachable)
export const highlightBarView = ({
  selected,
}: {
  readonly selected: Option<ProductCategory>
}) => (
  <nav
    aria-label='Categories'
    className='w-full max-w-[42.5rem] [scrollbar-width:none] overflow-x-auto pt-[1.375rem] pb-[2px] lg:pt-[2.875rem]'
  >
    <ul className='flex [justify-content:safe_center] gap-[0.5rem] px-[0.875rem] lg:gap-[0.75rem]'>
      {pipe(
        shownCategoryList,
        RA.map((category) =>
          highlightView({
            category,
            isSelected: O.elem(S.Eq)(category, selected),
          }),
        ),
      )}
    </ul>
  </nav>
)
