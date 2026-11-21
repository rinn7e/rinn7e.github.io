import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { type Product } from '@/common/data/product'

import { roundButtonClass } from './round-button'
import { type Msg } from './type'

// The screenshots of a product, one at a time, with arrows on the sides and
// dots under them
export const slideshowView = ({
  product,
  slideIndex,
  dispatch,
}: {
  readonly product: Product
  readonly slideIndex: number
  readonly dispatch: Dispatcher<Msg>
}) => {
  const count = product.slideList.length
  const showSlide = (index: number) =>
    dispatch({ _tag: 'ShowSlide', index: (index + count) % count })
  return (
    <div className='flex flex-col gap-[0.75rem]'>
      <div className='relative flex aspect-[16/10] max-h-[62vh] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-zinc-200 bg-zinc-100 p-[0.75rem] dark:border-zinc-700 dark:bg-zinc-900'>
        {pipe(
          RA.lookup(slideIndex)(product.slideList),
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
              onClick={() => showSlide(slideIndex - 1)}
            >
              <ChevronLeft aria-hidden='true' className='size-[1.125rem]' />
            </button>
            <button
              type='button'
              aria-label='Next screenshot'
              className={`${roundButtonClass} absolute top-1/2 right-[0.625rem] -translate-y-1/2`}
              onClick={() => showSlide(slideIndex + 1)}
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
                aria-current={index === slideIndex ? 'true' : undefined}
                className={[
                  'h-[0.5rem] rounded-full transition-colors',
                  index === slideIndex
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
