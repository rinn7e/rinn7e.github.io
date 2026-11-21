import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import { ExternalLink, Gamepad2, Puzzle } from 'lucide-react'
import { memo } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import {
  type Product,
  type ProductCategory,
  type ProductLink,
  productCategoryList,
  productList,
} from '@/common/data/product'
import { GithubIcon } from '@/component/icon'
import { centredColumnView } from '@/component/layout'

import { type Msg, type Props, PropsEq } from './type'

const categoryLabelOf = (category: ProductCategory): string => {
  switch (category) {
    case 'WebApp':
      return 'Web apps'
    case 'BrowserExtension':
      return 'Browser extensions'
    case 'Game':
      return 'Games'
    case 'DeveloperTool':
      return 'Developer tools'
  }
}

const isInCategory =
  (category: Option<ProductCategory>) =>
  (product: Product): boolean =>
    pipe(
      category,
      O.fold(
        () => true,
        (c) => pipe([...product.categoryList], A.elem(S.Eq)(c)),
      ),
    )

const countIn = (category: Option<ProductCategory>): number =>
  pipe([...productList], A.filter(isInCategory(category))).length

const ProductsScreen = ({ model, dispatch }: Props) => {
  const shownList = pipe(
    [...productList],
    A.filter(isInCategory(model.category)),
  )
  return centredColumnView({
    children: (
      <div className='flex flex-col items-center pb-[80px]'>
        {heroView()}
        <section
          aria-labelledby='products-title'
          className='flex w-full flex-col gap-[24px]'
        >
          {sectionTitleView({ id: 'products-title', title: 'Products' })}
          {categoryFilterView({ selected: model.category, dispatch })}
          <ul className='flex flex-wrap justify-center gap-[24px]'>
            {pipe(
              shownList,
              A.map((product) => (
                <li
                  key={product.id}
                  className='flex w-full lg:w-[calc((100%-24px)/2)]'
                >
                  {productCardView({ product })}
                </li>
              )),
            )}
          </ul>
        </section>
      </div>
    ),
  })
}

export const ProductsScreenMemo = memo(ProductsScreen, PropsEq.equals)

const heroView = () => (
  <div className='flex flex-col items-center gap-[16px] pt-[48px] pb-[40px] text-center lg:pt-[80px] lg:pb-[56px]'>
    <h1 className='max-w-[680px] text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance lg:text-[2.75rem]'>
      Tools, apps and games, built in the open
    </h1>
    <p className='max-w-[580px] text-[1rem] text-balance text-zinc-600 lg:text-[1.125rem] dark:text-zinc-400'>
      Browser extensions, web apps, games and developer tools that I design,
      build and maintain. Every one of them is open source.
    </p>
  </div>
)

// A section heading centred between two thin rules
const sectionTitleView = ({
  id,
  title,
}: {
  readonly id: string
  readonly title: string
}) => (
  <h2
    id={id}
    className='grid grid-cols-[1fr_auto_1fr] items-center gap-[16px] text-[0.8125rem] font-semibold tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400'
  >
    <span className='border-t border-zinc-200 dark:border-zinc-800' />
    {title}
    <span className='border-t border-zinc-200 dark:border-zinc-800' />
  </h2>
)

const chipClass = (isSelected: boolean): string =>
  [
    // shared class
    'flex items-center gap-[6px] rounded-full border px-[14px] py-[7px] text-[0.875rem] transition-colors',
    isSelected
      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-50',
  ].join(' ')

// The filter: a centred row of chips, every category and "All" first
const categoryFilterView = ({
  selected,
  dispatch,
}: {
  readonly selected: Option<ProductCategory>
  readonly dispatch: Dispatcher<Msg>
}) => {
  const optionList: Option<ProductCategory>[] = [
    O.none,
    ...pipe([...productCategoryList], A.map(O.some)),
  ]
  return (
    <div
      role='group'
      aria-label='Filter by category'
      className='flex flex-wrap justify-center gap-[8px]'
    >
      {pipe(
        optionList,
        A.map((option) => {
          const isSelected = O.getEq(S.Eq).equals(option, selected)
          const label = pipe(
            option,
            O.fold(() => 'All', categoryLabelOf),
          )
          return (
            <button
              key={label}
              type='button'
              aria-pressed={isSelected}
              className={chipClass(isSelected)}
              onClick={() =>
                dispatch({ _tag: 'SelectCategory', category: option })
              }
            >
              {label}
              <span className='opacity-70'>{countIn(option)}</span>
            </button>
          )
        }),
      )}
    </div>
  )
}

const productCardView = ({ product }: { readonly product: Product }) => (
  <article className='flex w-full flex-col overflow-hidden rounded-[14px] border border-zinc-200 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'>
    {/* `overflow-hidden` keeps the frame at 16:10 (it drops the automatic
        minimum height), so a tall screenshot shrinks to fit inside it */}
    <div className='flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-zinc-200 bg-zinc-50 p-[14px] lg:p-[20px] dark:border-zinc-800 dark:bg-zinc-900'>
      <img
        src={`/${product.image}`}
        alt={product.imageAlt}
        loading='lazy'
        className={[
          'max-h-full max-w-full rounded-[6px] border border-zinc-200 dark:border-zinc-700',
          product.isPixelArt ? '[image-rendering:pixelated]' : '',
        ].join(' ')}
      />
    </div>
    <div className='flex flex-1 flex-col items-center gap-[10px] px-[16px] pt-[16px] pb-[20px] text-center lg:px-[24px] lg:pt-[20px] lg:pb-[24px]'>
      <h3 className='text-[1.25rem] font-semibold'>{product.name}</h3>
      <span className='rounded-full border border-zinc-200 px-[10px] py-[2px] text-[0.75rem] tracking-[0.04em] text-zinc-600 uppercase dark:border-zinc-800 dark:text-zinc-400'>
        {product.kind}
      </span>
      <p className='max-w-[480px] text-balance text-zinc-600 dark:text-zinc-400'>
        {product.description}
      </p>
      {/* Takes the room left, so the links of cards side by side line up */}
      <div className='flex flex-1 items-end justify-center pt-[8px]'>
        <div className='flex flex-wrap justify-center gap-[8px]'>
          {pipe(
            [...product.linkList],
            A.map((link) => productLinkView({ link })),
          )}
        </div>
      </div>
    </div>
  </article>
)

const productLinkClass =
  'flex items-center gap-[7px] rounded-[8px] border border-zinc-300 px-[14px] py-[7px] text-[0.875rem] text-zinc-900 transition-colors hover:border-blue-600 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-blue-400 dark:hover:text-blue-300'

const iconClass = 'size-[16px] shrink-0'

const productLinkView = ({ link }: { readonly link: ProductLink }) => {
  switch (link._tag) {
    case 'LiveLink':
      return (
        <a key={link.url} href={link.url} className={productLinkClass}>
          <ExternalLink aria-hidden='true' className={iconClass} />
          {link.label}
        </a>
      )
    case 'ChromeWebStoreLink':
      return (
        <a key={link.url} href={link.url} className={productLinkClass}>
          <Puzzle aria-hidden='true' className={iconClass} />
          Chrome Web Store
        </a>
      )
    case 'FirefoxAddonsLink':
      return (
        <a key={link.url} href={link.url} className={productLinkClass}>
          <Puzzle aria-hidden='true' className={iconClass} />
          Firefox Add-ons
        </a>
      )
    case 'PlayLink':
      return (
        <a key={link.url} href={link.url} className={productLinkClass}>
          <Gamepad2 aria-hidden='true' className={iconClass} />
          Play in the browser
        </a>
      )
    case 'SourceLink':
      return (
        <a key={link.url} href={link.url} className={productLinkClass}>
          <GithubIcon className={iconClass} />
          Source
        </a>
      )
  }
}
