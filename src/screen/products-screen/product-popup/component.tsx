import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { X } from 'lucide-react'
import React, { memo } from 'react'

import { type Product, productList } from '@/common/data/product'
import { prefersReducedMotion } from '@/common/util'

import { ProductCardMemo } from '../common/product-card/component'
import { panelCardDomId } from '../common/product-card/dom-id'
import { flightStyleOf, popupLayerClassOf, revealClassOf } from './phase-style'
import { productLinkView } from './product-link'
import { roundButtonClass } from './round-button'
import { slideshowView } from './slideshow'
import { type Msg, type Props, PropsEq, isClosingPhase } from './type'

const closeMsg = (): Msg => ({
  _tag: 'Close',
  isAnimated: !prefersReducedMotion(),
})

// The popup of a product over the page: a dimmed backdrop, and on it a white
// panel with the screenshots, the card and the text. It closes with its
// close button, Escape, or a click on the backdrop. On a small screen the
// popup scrolls by itself, and no scroll in it ever reaches the page under
// it (`overscroll-contain`). The page keeps its scrollbar: hiding it
// (`overflow: hidden`) shifted the page sideways, as the bar of the site is
// a styled one of 12px and a hidden root keeps no room for it on a system
// with overlay scrollbars.
// The popup draws the product of its model, looked up in the list (nothing
// when the id is not known), so its product can never differ from its model
const ProductPopup = ({ model, isFlipped, dispatch }: Props) =>
  pipe(
    productList,
    RA.findFirst((product) => product.id === model.id),
    O.fold(
      () => null,
      (product) => productPopupView({ product, model, isFlipped, dispatch }),
    ),
  )

type ViewProps = Props & { readonly product: Product }

const productPopupView = ({
  product,
  model,
  isFlipped,
  dispatch,
}: ViewProps) => (
  <div
    className={[
      'fixed inset-0 z-40 flex items-start justify-center overflow-y-auto overscroll-contain p-[0.75rem] lg:items-center lg:p-[2rem]',
      // While it closes, clicks go through to the page, so another card
      // opens at once
      isClosingPhase(model.phase) ? 'pointer-events-none' : '',
    ].join(' ')}
  >
    <div
      aria-hidden='true'
      className={`absolute inset-0 bg-black/45 ${popupLayerClassOf(model.phase)}`}
      onClick={() => dispatch(closeMsg())}
    />
    <div
      role='dialog'
      aria-modal='true'
      aria-label={product.name}
      className='relative w-full max-w-[90rem] p-[1.25rem] pt-[3.75rem] lg:px-[2.75rem] lg:pt-[4rem] lg:pb-[2.75rem]'
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          dispatch(closeMsg())
        } else {
          // Other keys act inside the popup as usual
        }
      }}
    >
      <div
        aria-hidden='true'
        className={`absolute inset-0 rounded-[1.25rem] bg-white shadow-[0_4px_16px_rgb(0_0_0/0.18)] dark:bg-zinc-900 ${popupLayerClassOf(model.phase)}`}
      />
      {productPanelView({ product, model, isFlipped, dispatch })}
      <button
        type='button'
        // Focus moves into the popup when it opens, so Escape reaches it
        autoFocus
        aria-label={`Close ${product.name}`}
        className={`${roundButtonClass} absolute top-[1rem] right-[1rem] ${revealClassOf(model.phase, 'delay-[120ms]')}`}
        onClick={() => dispatch(closeMsg())}
      >
        <X aria-hidden='true' className='size-[1.125rem]' />
      </button>
    </div>
  </div>
)

const productPanelView = ({
  product,
  model,
  isFlipped,
  dispatch,
}: ViewProps) => (
  <article className='relative flex w-full flex-col gap-[1rem]'>
    {/* The slideshow spans the popup, its card over the bottom right
        corner (the padding keeps the room of the card); the text sits
        under it. While a video plays the card fades out, so it never hides
        the controls of the player; it is back for another slide, and for
        its flight back to the grid on close. */}
    <div className='relative w-full pb-[5.25rem] lg:pb-[3rem]'>
      <div className={revealClassOf(model.phase, 'delay-[0ms]')}>
        {slideshowView({
          product,
          slideIndex: model.slideIndex,
          isPlaying: model.isPlaying,
          dispatch,
        })}
      </div>
      <div
        className={[
          'absolute right-[0.75rem] bottom-[0] transition-opacity lg:right-[1.5rem]',
          model.isPlaying && model.phase._tag === 'Shown'
            ? 'pointer-events-none opacity-0'
            : '',
        ].join(' ')}
      >
        <div
          id={panelCardDomId(product.id)}
          style={flightStyleOf(model.phase)}
          className='[transform-style:preserve-3d]'
        >
          {/* A click on the card puts it back in the grid */}
          <button
            type='button'
            aria-label={`Close ${product.name}`}
            className={[
              'block rounded-[1.125rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100',
              // In flight, the card takes no pointer at all
              model.phase._tag === 'Shown' ? '' : 'pointer-events-none',
            ].join(' ')}
            onClick={() => dispatch(closeMsg())}
          >
            <ProductCardMemo
              hasQuickLink={false}
              product={product}
              size='PanelCard'
              isFlipped={isFlipped}
              isTracked={model.phase._tag === 'Shown'}
            />
          </button>
        </div>
      </div>
    </div>
    <div className='flex flex-col items-start gap-[0.75rem] lg:max-w-[48rem] lg:pr-[12rem]'>
      <h2
        className={`text-[1.75rem] leading-[1.15] font-semibold ${revealClassOf(model.phase, 'delay-[40ms]')}`}
      >
        {product.name}
      </h2>
      <span
        className={`rounded-full border border-zinc-200 px-[0.625rem] py-[2px] text-[0.75rem] tracking-[0.04em] text-zinc-600 uppercase dark:border-zinc-700 dark:text-zinc-400 ${revealClassOf(model.phase, 'delay-[60ms]')}`}
      >
        {product.kind}
      </span>
      <p
        className={`text-zinc-600 dark:text-zinc-400 ${revealClassOf(model.phase, 'delay-[80ms]')}`}
      >
        {product.description}
      </p>
      <div
        className={`flex flex-wrap gap-[0.5rem] pt-[0.5rem] ${revealClassOf(model.phase, 'delay-[100ms]')}`}
      >
        {pipe(
          product.linkList,
          RA.map((link) => productLinkView({ link })),
        )}
      </div>
    </div>
  </article>
)

export const ProductPopupMemo = memo(ProductPopup, PropsEq.equals)
