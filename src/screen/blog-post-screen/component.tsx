import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import React, { memo, useContext } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { readableDateOf } from '@/common/data/blog'
import {
  type GlobalNavigationMsg,
  SetGlobalMsgContext,
} from '@/common/global-context'
import { blogDestination, parseDestination } from '@/common/type/destination'
import { newTabProps } from '@/common/util'
import { blogTagListView } from '@/component/blog-tag-list'
import { Link } from '@/component/link'

import { type Props, PropsEq } from './type'

// The page of a post: a link back to the list, the day, the title and the
// tags on the centre axis, then the body (HTML rendered by the build, styled
// by `.blog-prose` in `src/asset/index.css`), then where it was first
// published, with a link to the original on dev.to. A memo of the post: it
// draws once per post.

// A link of the body to a page of this site (another post) moves in the app
// on a plain left click, as a `Link` does; every other link keeps the
// browser's behaviour (the build opens outside links in a new tab)
const bodyClickHandler =
  (setGlobalMsg: Dispatcher<GlobalNavigationMsg>) =>
  (e: React.MouseEvent<HTMLElement>) => {
    const anchor = e.target instanceof Element ? e.target.closest('a') : null
    if (
      anchor !== null &&
      (anchor.getAttribute('href') ?? '').startsWith('/') &&
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault()
      setGlobalMsg({
        _tag: 'NavigationMsg',
        subMsg: {
          _tag: 'Navigate',
          destination: parseDestination(anchor.href),
        },
      })
    }
  }

const quietLinkClass =
  'flex h-[2rem] items-center gap-[0.375rem] rounded-[0.5rem] px-[0.5rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase transition-colors hover:bg-[#f0f2f5] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'

const buttonClass =
  'flex h-[2.5rem] items-center justify-center gap-[0.5rem] rounded-[0.75rem] bg-[#f0f2f5] px-[1rem] text-[0.8125rem] font-semibold text-[#0c1014] transition-colors hover:bg-[#e3e6ea] lg:h-[2.75rem] lg:text-[0.875rem] dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700'

const BlogPostScreen = ({ model }: Props) => {
  const setGlobalMsg = useContext(SetGlobalMsgContext)
  const { post } = model
  return (
    <div className='flex flex-col items-center pt-[1.5rem] pb-[6rem] lg:pt-[2rem]'>
      <article className='flex w-full max-w-[42.5rem] flex-col gap-[2rem]'>
        <header className='flex flex-col items-center gap-[0.75rem] text-center'>
          <Link destination={blogDestination()} className={quietLinkClass}>
            <ArrowLeft aria-hidden='true' className='size-[1rem]' />
            All posts
          </Link>
          <time
            dateTime={post.date}
            className='pt-[0.5rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase dark:text-zinc-400'
          >
            {readableDateOf(post.date)}
          </time>
          <h1 className='text-[1.5rem] leading-[1.25] font-bold text-balance lg:text-[2rem]'>
            {post.title}
          </h1>
          {blogTagListView({ tagList: post.tagList })}
        </header>
        {pipe(
          post.coverImage,
          O.fold(
            () => null,
            (src) => (
              <img
                src={src}
                alt=''
                className='w-full rounded-[0.875rem] border border-zinc-200 dark:border-zinc-800'
              />
            ),
          ),
        )}
        <div
          className='blog-prose'
          onClick={bodyClickHandler(setGlobalMsg)}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <footer className='flex flex-col items-center gap-[1rem] rounded-[0.875rem] border border-zinc-200 bg-white px-[1.25rem] py-[1.5rem] text-center dark:border-zinc-800 dark:bg-zinc-950'>
          <p className='text-[0.875rem] leading-[1.6] text-balance text-zinc-600 dark:text-zinc-400'>
            First published on dev.to, where the comments and reactions are.
          </p>
          <div className='flex w-full max-w-[26rem] flex-col gap-[0.5rem] lg:flex-row'>
            <Link
              destination={blogDestination()}
              className={`${buttonClass} lg:flex-1`}
            >
              <ArrowLeft aria-hidden='true' className='size-[1rem]' />
              All posts
            </Link>
            <a
              {...newTabProps}
              href={post.canonicalUrl}
              className={`${buttonClass} lg:flex-1`}
            >
              Read on dev.to
              <ArrowUpRight aria-hidden='true' className='size-[1rem]' />
            </a>
          </div>
        </footer>
      </article>
    </div>
  )
}

export const BlogPostScreenMemo = memo(BlogPostScreen, PropsEq.equals)
