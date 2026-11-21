import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  Puzzle,
  X,
} from 'lucide-react'
import React, { memo } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import {
  type Product,
  type ProductCategory,
  type ProductLink,
  productList,
} from '@/common/data/product'
import { newTabProps } from '@/common/util'
import { GithubIcon } from '@/component/icon'

import { ProductCardMemo } from './common/product-card'
import {
  CLOSE_MS,
  type Msg,
  type OpenPhase,
  type OpenedProduct,
  type Props,
  PropsEq,
  RETURN_MS,
  SPIN_MS,
  gridCardDomId,
  panelCardDomId,
} from './type'

// Every product as its card in a grid under the profile, dealt one after
// the other on the first load: six a row across the page at most (each
// column at least a sixth of it), at least 150px each, so fewer on a
// narrower screen. A highlight filters the cards to its category. The product
// opened shows in a popup over the page: its card leaves its place in the
// grid (which keeps the room, so the grid does not move), flies and spins
// into the popup, then the screenshots and the text fade in.
const ProductsScreen = ({ model, dispatch }: Props) => (
  <>
    <ul className='grid grid-cols-[repeat(auto-fill,minmax(max(9.375rem,calc((100%-5px)/6)),1fr))] gap-[1px] pt-[1px] pb-[6rem]'>
      {pipe(
        productList,
        RA.filter(isInCategory(model.category)),
        RA.mapWithIndex((index, product) => (
          <li
            key={product.id}
            style={{ '--deal-index': index }}
            className={[
              'p-[0.5rem] lg:p-[0.75rem]',
              // Away in the popup: the cell keeps its room
              O.isSome(openedAs(model.openedList, product)) ? 'invisible' : '',
              // A card back from the popup shows at once, not dealt again
              RA.elem(S.Eq)(product.id)(model.returnedList)
                ? ''
                : model.isFirstShow
                  ? 'deal-in'
                  : '',
            ].join(' ')}
          >
            {columnCardView({
              product,
              isFlipped: model.isFlipped,
              dispatch,
            })}
          </li>
        )),
      )}
    </ul>
    {pipe(
      model.openedList,
      RA.head,
      O.chain((opened) =>
        pipe(
          productList,
          RA.findFirst((product) => product.id === opened.id),
          O.map((product) =>
            productPopupView({
              product,
              opened,
              isFlipped: model.isFlipped,
              dispatch,
            }),
          ),
        ),
      ),
      O.toNullable,
    )}
  </>
)

const isInCategory =
  (category: Option<ProductCategory>) =>
  (product: Product): boolean =>
    pipe(
      category,
      O.fold(
        () => true,
        (c) => RA.elem(S.Eq)(c)(product.categoryList),
      ),
    )

export const ProductsScreenMemo = memo(ProductsScreen, PropsEq.equals)

const openedAs = (
  openedList: readonly OpenedProduct[],
  product: Product,
): Option<OpenedProduct> =>
  pipe(
    openedList,
    RA.findFirst((opened) => opened.id === product.id),
  )

// Read when the visitor acts, so a change of the setting counts at once
const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const columnCardView = ({
  product,
  dispatch,
  isFlipped,
}: {
  readonly product: Product
  readonly dispatch: Dispatcher<Msg>
  readonly isFlipped: boolean
}) => (
  <button
    type='button'
    id={gridCardDomId(product.id)}
    aria-label={`Open ${product.name}`}
    className='block w-full rounded-[1.125rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100'
    onClick={(event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      dispatch({
        _tag: 'OpenProduct',
        id: product.id,
        from: prefersReducedMotion()
          ? O.none
          : O.some({ left: rect.left, top: rect.top, width: rect.width }),
      })
    }}
  >
    <ProductCardMemo
      product={product}
      size='ColumnCard'
      isFlipped={isFlipped}
      isTracked
    />
  </button>
)

// Where the card on the panel is drawn in each phase. The numbers come from
// the measures of the model, so they go through `style`: the one runtime
// value of this view that a class cannot hold.
const flightStyleOf = (phase: OpenPhase): React.CSSProperties => {
  switch (phase._tag) {
    case 'Measuring':
      return { opacity: 0 }
    case 'Flying': {
      const dx = phase.from.left - phase.to.left
      const dy = phase.from.top - phase.to.top
      const scale = phase.from.width / phase.to.width
      return {
        transformOrigin: 'top left',
        transform: `perspective(900px) translate(${dx}px, ${dy}px) scale(${scale}) rotateY(0deg)`,
      }
    }
    case 'Spinning':
      return {
        transformOrigin: 'top left',
        transform:
          'perspective(900px) translate(0px, 0px) scale(1) rotateY(360deg)',
        transition: `transform ${SPIN_MS}ms cubic-bezier(0.25, 0.9, 0.25, 1)`,
      }
    case 'Shown':
    case 'Closing':
      return {}
    case 'Returning': {
      // Back to its place in the grid, spinning the other way
      const dx = phase.to.left - phase.from.left
      const dy = phase.to.top - phase.from.top
      const scale = phase.to.width / phase.from.width
      return {
        transformOrigin: 'top left',
        transform: `perspective(900px) translate(${dx}px, ${dy}px) scale(${scale}) rotateY(-360deg)`,
        transition: `transform ${RETURN_MS}ms cubic-bezier(0.5, 0, 0.3, 1)`,
      }
    }
    case 'FadingOut':
      return {
        opacity: 0,
        transform: 'scale(0.85)',
        transition: `opacity ${CLOSE_MS}ms ease-in, transform ${CLOSE_MS}ms ease-in`,
      }
  }
}

// The screenshots and the text fade in with the white of the popup, while
// the card is still in flight, one shortly after the other (`delayClass`),
// and fade out first when the panel closes
const revealClassOf = (phase: OpenPhase, delayClass: string): string => {
  switch (phase._tag) {
    case 'Measuring':
      return 'opacity-0'
    case 'Flying':
    case 'Spinning':
    case 'Shown':
      return `opacity-100 transition-opacity duration-[300ms] ease-out ${delayClass}`
    case 'Closing':
    case 'Returning':
    case 'FadingOut':
      return 'opacity-0 transition-opacity duration-[200ms] ease-in'
  }
}

const roundButtonClass =
  'flex size-[2.25rem] items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-400 dark:hover:text-zinc-50'

// The backdrop and the white of the popup fade in with the flight of the
// card, and out while it flies back; the card itself is not faded with them
const popupLayerClassOf = (phase: OpenPhase): string => {
  switch (phase._tag) {
    case 'Measuring':
      return 'opacity-0'
    case 'Flying':
    case 'Spinning':
    case 'Shown':
      return 'opacity-100 transition-opacity duration-[300ms] ease-out'
    case 'Closing':
    case 'Returning':
    case 'FadingOut':
      return 'opacity-0 transition-opacity duration-[260ms] ease-in'
  }
}

const isClosingPhase = (phase: OpenPhase): boolean =>
  phase._tag === 'Closing' ||
  phase._tag === 'Returning' ||
  phase._tag === 'FadingOut'

const closeMsgOf = (product: Product): Msg => ({
  _tag: 'CloseProduct',
  id: product.id,
  isAnimated: !prefersReducedMotion(),
})

// The popup of a product over the page: a dimmed backdrop, and on it a white
// panel with the screenshots, the card and the text. It closes with its
// close button, Escape, or a click on the backdrop. The page under it does
// not scroll (`data-popup-open`, see the CSS); on a small screen the popup
// scrolls by itself.
const productPopupView = ({
  product,
  opened,
  dispatch,
  isFlipped,
}: {
  readonly product: Product
  readonly opened: OpenedProduct
  readonly dispatch: Dispatcher<Msg>
  readonly isFlipped: boolean
}) => (
  <div
    data-popup-open='true'
    className={[
      'fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-[0.75rem] lg:items-center lg:p-[2rem]',
      // While it closes, clicks go through to the page, so another card
      // opens at once
      isClosingPhase(opened.phase) ? 'pointer-events-none' : '',
    ].join(' ')}
  >
    <div
      aria-hidden='true'
      className={`absolute inset-0 bg-black/45 ${popupLayerClassOf(opened.phase)}`}
      onClick={() => dispatch(closeMsgOf(product))}
    />
    <div
      role='dialog'
      aria-modal='true'
      aria-label={product.name}
      className='relative w-full max-w-[90rem] p-[1.25rem] pt-[3.75rem] lg:px-[2.75rem] lg:pt-[4rem] lg:pb-[2.75rem]'
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          dispatch(closeMsgOf(product))
        } else {
          // Other keys act inside the popup as usual
        }
      }}
    >
      <div
        aria-hidden='true'
        className={`absolute inset-0 rounded-[1.25rem] bg-white shadow-[0_4px_16px_rgb(0_0_0/0.18)] dark:bg-zinc-900 ${popupLayerClassOf(opened.phase)}`}
      />
      {productPanelView({ product, opened, isFlipped, dispatch })}
      <button
        type='button'
        // Focus moves into the popup when it opens, so Escape reaches it
        autoFocus
        aria-label={`Close ${product.name}`}
        className={`${roundButtonClass} absolute top-[1rem] right-[1rem] ${revealClassOf(opened.phase, 'delay-[120ms]')}`}
        onClick={() => dispatch(closeMsgOf(product))}
      >
        <X aria-hidden='true' className='size-[1.125rem]' />
      </button>
    </div>
  </div>
)

const productPanelView = ({
  product,
  opened,
  dispatch,
  isFlipped,
}: {
  readonly product: Product
  readonly opened: OpenedProduct
  readonly dispatch: Dispatcher<Msg>
  readonly isFlipped: boolean
}) => (
  <article className='relative flex w-full flex-col gap-[1rem]'>
    {/* The slideshow spans the popup, its card over the bottom right
        corner (the padding keeps the room of the card); the text sits
        under it */}
    <div className='relative w-full pb-[5.25rem] lg:pb-[3rem]'>
      <div className={revealClassOf(opened.phase, 'delay-[0ms]')}>
        {slideshowView({ product, opened, dispatch })}
      </div>
      <div className='absolute right-[0.75rem] bottom-[0] lg:right-[1.5rem]'>
        <div
          id={panelCardDomId(product.id)}
          style={flightStyleOf(opened.phase)}
          className='[transform-style:preserve-3d]'
        >
          {/* A click on the card puts it back in the grid */}
          <button
            type='button'
            aria-label={`Close ${product.name}`}
            className={[
              'block rounded-[1.125rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100',
              // In flight, the card takes no pointer at all
              opened.phase._tag === 'Shown' ? '' : 'pointer-events-none',
            ].join(' ')}
            onClick={() => dispatch(closeMsgOf(product))}
          >
            <ProductCardMemo
              product={product}
              size='PanelCard'
              isFlipped={isFlipped}
              isTracked={opened.phase._tag === 'Shown'}
            />
          </button>
        </div>
      </div>
    </div>
    <div className='flex flex-col items-start gap-[0.75rem] lg:max-w-[48rem] lg:pr-[12rem]'>
      <h2
        className={`text-[1.75rem] leading-[1.15] font-semibold ${revealClassOf(opened.phase, 'delay-[40ms]')}`}
      >
        {product.name}
      </h2>
      <span
        className={`rounded-full border border-zinc-200 px-[0.625rem] py-[2px] text-[0.75rem] tracking-[0.04em] text-zinc-600 uppercase dark:border-zinc-700 dark:text-zinc-400 ${revealClassOf(opened.phase, 'delay-[60ms]')}`}
      >
        {product.kind}
      </span>
      <p
        className={`text-zinc-600 dark:text-zinc-400 ${revealClassOf(opened.phase, 'delay-[80ms]')}`}
      >
        {product.description}
      </p>
      <div
        className={`flex flex-wrap gap-[0.5rem] pt-[0.5rem] ${revealClassOf(opened.phase, 'delay-[100ms]')}`}
      >
        {pipe(
          product.linkList,
          RA.map((link) => productLinkView({ link })),
        )}
      </div>
    </div>
  </article>
)

const slideshowView = ({
  product,
  opened,
  dispatch,
}: {
  readonly product: Product
  readonly opened: OpenedProduct
  readonly dispatch: Dispatcher<Msg>
}) => {
  const count = product.slideList.length
  const showSlide = (index: number) =>
    dispatch({
      _tag: 'ShowSlide',
      id: product.id,
      index: (index + count) % count,
    })
  return (
    <div className='flex flex-col gap-[0.75rem]'>
      <div className='relative flex aspect-[16/10] max-h-[62vh] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-zinc-200 bg-zinc-100 p-[0.75rem] dark:border-zinc-700 dark:bg-zinc-900'>
        {pipe(
          RA.lookup(opened.slideIndex)(product.slideList),
          O.fold(
            () => null,
            (slide) => (
              // A new screenshot replaces the last one at once, with no
              // animation: one img whose source changes, so the last one
              // stays until the next is decoded instead of a blank frame
              <img
                src={`/${slide.src}`}
                alt={slide.alt}
                className={[
                  'max-h-full max-w-full rounded-[0.5rem]',
                  product.isPixelArt ? '[image-rendering:pixelated]' : '',
                ].join(' ')}
              />
            ),
          ),
        )}
        {count > 1 ? (
          <>
            <button
              type='button'
              aria-label='Previous screenshot'
              className={`${roundButtonClass} absolute top-1/2 left-[0.625rem] -translate-y-1/2`}
              onClick={() => showSlide(opened.slideIndex - 1)}
            >
              <ChevronLeft aria-hidden='true' className='size-[1.125rem]' />
            </button>
            <button
              type='button'
              aria-label='Next screenshot'
              className={`${roundButtonClass} absolute top-1/2 right-[0.625rem] -translate-y-1/2`}
              onClick={() => showSlide(opened.slideIndex + 1)}
            >
              <ChevronRight aria-hidden='true' className='size-[1.125rem]' />
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className='flex gap-[0.375rem]'>
          {pipe(
            product.slideList,
            RA.mapWithIndex((index, slide) => (
              <button
                key={slide.src}
                type='button'
                aria-label={`Screenshot ${index + 1} of ${count}`}
                aria-current={index === opened.slideIndex ? 'true' : undefined}
                className={[
                  'h-[0.5rem] rounded-full transition-colors',
                  index === opened.slideIndex
                    ? 'w-[1.5rem] bg-zinc-800 dark:bg-zinc-100'
                    : 'w-[0.5rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400',
                ].join(' ')}
                onClick={() => showSlide(index)}
              />
            )),
          )}
        </div>
      ) : null}
    </div>
  )
}

const productLinkClass =
  'flex items-center gap-[0.4375rem] rounded-[0.5rem] border border-zinc-300 px-[0.875rem] py-[0.4375rem] text-[0.875rem] text-zinc-900 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-400'

const iconClass = 'size-[1rem] shrink-0'

const productLinkView = ({ link }: { readonly link: ProductLink }) => {
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
