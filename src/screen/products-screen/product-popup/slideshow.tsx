import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import React from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { type Product, type ProductSlide } from '@/common/data/product'

import { roundButtonClass } from './round-button'
import { type Msg, videoPlayerDomId } from './type'

// A key and a label of a slide, for the dots under the slideshow
const slideKeyOf = (slide: ProductSlide): string =>
  slide._tag === 'ImageSlide' ? slide.src : slide.youtubeId

// The player of YouTube in its privacy-enhanced mode (no cookies before
// play), drawn only after a click on play. It takes commands as messages
// (`enablejsapi`), so once it loads it gets its volume, then plays (see
// `startPlayerCmd`).
const youtubeEmbedUrlOf = (youtubeId: string): string =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?enablejsapi=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`

// A video before it is played: its poster, a screenshot of this site, with
// a play button on the axis. Nothing comes from YouTube until the click.
const videoPosterView = ({
  slide,
  dispatch,
}: {
  readonly slide: Extract<ProductSlide, { _tag: 'VideoSlide' }>
  readonly dispatch: Dispatcher<Msg>
}) => (
  <button
    type='button'
    aria-label={`Play the video: ${slide.title}`}
    className='group relative flex max-h-full max-w-full items-center justify-center rounded-[0.5rem]'
    onClick={() => dispatch({ _tag: 'PlayVideo' })}
  >
    <img
      src={`/${slide.poster}`}
      alt=''
      className='max-h-full max-w-full rounded-[0.5rem] opacity-70 transition-opacity group-hover:opacity-60'
    />
    <span className='absolute flex size-[4rem] items-center justify-center rounded-full bg-zinc-900/85 text-white transition-transform group-hover:scale-105 lg:size-[4.5rem] dark:bg-zinc-100/90 dark:text-zinc-900'>
      <Play
        aria-hidden='true'
        className='ml-[0.25rem] size-[1.75rem] fill-current'
      />
    </span>
  </button>
)

// One slide: a screenshot, or a video (its poster, then the player)
const slideView = ({
  slide,
  isPixelArt,
  isPlaying,
  dispatch,
}: {
  readonly slide: ProductSlide
  readonly isPixelArt: boolean
  readonly isPlaying: boolean
  readonly dispatch: Dispatcher<Msg>
}) => {
  switch (slide._tag) {
    case 'ImageSlide':
      return (
        // A new screenshot replaces the last one at once, with no
        // animation: one img whose source changes, so the last one stays
        // until the next is decoded instead of a blank frame
        <img
          src={`/${slide.src}`}
          alt={slide.alt}
          className={[
            'max-h-full max-w-full rounded-[0.5rem]',
            isPixelArt ? '[image-rendering:pixelated]' : '',
          ].join(' ')}
        />
      )
    case 'VideoSlide':
      return isPlaying ? (
        <iframe
          id={videoPlayerDomId}
          src={youtubeEmbedUrlOf(slide.youtubeId)}
          onLoad={() => dispatch({ _tag: 'PlayerLoaded' })}
          title={slide.title}
          allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
          allowFullScreen
          // What the player needs to run, go full screen and open YouTube
          // in a new tab, and nothing more. Scripts with the same origin is
          // only a risk for a page of this site, which could lift its own
          // sandbox; the player comes from another origin.
          // eslint-disable-next-line react-dom/no-unsafe-iframe-sandbox
          sandbox='allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox'
          className='aspect-video max-h-full w-full rounded-[0.5rem] border-0'
        />
      ) : (
        videoPosterView({ slide, dispatch })
      )
  }
}

// The slides of a product (its video, then its screenshots), one at a time,
// with arrows on the sides and dots under them
export const slideshowView = ({
  product,
  slideIndex,
  isPlaying,
  dispatch,
}: {
  readonly product: Product
  readonly slideIndex: number
  readonly isPlaying: boolean
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
            (slide) =>
              slideView({
                slide,
                isPixelArt: product.isPixelArt,
                isPlaying,
                dispatch,
              }),
          ),
        )}
        {count > 1 ? (
          <>
            <button
              type='button'
              aria-label='Previous slide'
              className={`${roundButtonClass} absolute top-1/2 left-[0.625rem] -translate-y-1/2`}
              onClick={() => showSlide(slideIndex - 1)}
            >
              <ChevronLeft aria-hidden='true' className='size-[1.125rem]' />
            </button>
            <button
              type='button'
              aria-label='Next slide'
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
                key={slideKeyOf(slide)}
                type='button'
                aria-label={`${slide._tag === 'VideoSlide' ? 'Video' : 'Screenshot'}, slide ${index + 1} of ${count}`}
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
