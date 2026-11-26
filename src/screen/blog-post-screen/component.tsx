import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { ArrowLeft, ArrowUpRight, MessageCircle } from 'lucide-react'
import React, { memo, useContext } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { isNewPost } from '@/common/data/blog'
import {
  type GlobalNavigationMsg,
  SetGlobalMsgContext,
} from '@/common/global-context'
import { type BlogPost } from '@/common/type/blog-post'
import { blogDestination, parseDestination } from '@/common/type/destination'
import { newTabProps } from '@/common/util'
import {
  blogDateView,
  blogMetaClass,
  readingTimeOf,
} from '@/component/blog/meta'
import { newBadgeView } from '@/component/blog/new-badge'
import { blogTagListView } from '@/component/blog/tag-list'
import { Link } from '@/component/link'

import { neighbourPostView } from './neighbour-post'
import { type Props, PropsEq } from './type'

// The page of a post, on the centre axis: one solid card, so the faint
// backdrop of the page never shows behind its text, then the newer and the
// older post. In the card, a mirrored row (back to the list on the left
// edge, the original on dev.to on the right), the day and the minutes to
// read, the title and the tags, centred; the body, left-aligned in a
// centred column (HTML rendered by the build, styled by `.blog-prose` in
// `src/asset/index.css`); and the discussion, which lives on dev.to,
// centred between two rules. A memo of the post: it draws once per post.

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

// The quiet buttons at the two edges of the card, as Flip and Clear filter
// at the ends of the tabs
const edgeLinkClass =
  'flex h-[2rem] items-center gap-[0.375rem] rounded-[0.5rem] px-[0.5rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase transition-colors hover:bg-[#f0f2f5] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'

// The buttons of the profile
const buttonClass =
  'flex h-[2.5rem] items-center justify-center gap-[0.5rem] rounded-[0.75rem] bg-[#f0f2f5] px-[1.25rem] text-[0.8125rem] font-semibold text-[#0c1014] transition-colors hover:bg-[#e3e6ea] lg:h-[2.75rem] lg:text-[0.875rem] dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700'

const ruleView = () => (
  <span
    aria-hidden='true'
    className='h-px flex-1 bg-zinc-200 dark:bg-zinc-800'
  />
)

const discussionView = ({ post }: { readonly post: BlogPost }) => (
  <section
    aria-label='Discussion'
    className='flex flex-col items-center gap-[1rem] px-[1rem] pb-[2rem] text-center lg:px-[4rem] lg:pb-[3rem]'
  >
    <div className='flex w-full items-center gap-[1rem]'>
      {ruleView()}
      <h2 className={blogMetaClass}>Discussion</h2>
      {ruleView()}
    </div>
    <p className='text-[0.9375rem] leading-[1.6] text-balance text-zinc-600 lg:text-[1.125rem] dark:text-zinc-400'>
      This post was first published on dev.to, where its comments and reactions
      are.
    </p>
    <a
      {...newTabProps}
      href={`${post.devToUrl}#comments`}
      className={buttonClass}
    >
      Join the discussion on dev.to
      <ArrowUpRight aria-hidden='true' className='size-[1rem]' />
    </a>
  </section>
)

// The links of the bar at the bottom of a phone, with room for a thumb
const barLinkClass =
  'flex h-[2.75rem] items-center gap-[0.375rem] rounded-[0.5rem] px-[0.75rem] text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase transition-colors hover:bg-[#f0f2f5] hover:text-[#0c1014] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'

// On a phone, a bar across the bottom of the screen that stays in view
// while the post is read (sticky, so it stops at the end of the post and
// never covers the footer): back to the list on the left, the discussion
// on dev.to on the right, mirrored as the row at the top of the card on a
// desktop
const phoneBarView = ({ post }: { readonly post: BlogPost }) => (
  <nav
    aria-label='This post'
    className='sticky bottom-0 z-10 flex w-[calc(100%+2rem)] items-center justify-between border-t border-zinc-200 bg-white px-[0.5rem] py-[0.25rem] lg:hidden dark:border-zinc-800 dark:bg-zinc-950'
  >
    <Link destination={blogDestination()} className={barLinkClass}>
      <ArrowLeft aria-hidden='true' className='size-[1rem]' />
      All posts
    </Link>
    <a
      {...newTabProps}
      href={`${post.devToUrl}#comments`}
      className={barLinkClass}
    >
      Discuss
      <MessageCircle aria-hidden='true' className='size-[1rem]' />
    </a>
  </nav>
)

const BlogPostScreen = ({ model, newSince }: Props) => {
  const setGlobalMsg = useContext(SetGlobalMsgContext)
  const { post } = model
  return (
    <div className='flex flex-col items-center gap-[1rem] pt-[1rem] pb-[6rem] lg:pt-[1.5rem]'>
      {/* On a phone the card is a band across the whole screen: its column
          plus the 1rem side padding of the page (the column is centred, so
          it reaches past that padding on both sides alike). Not `100dvw`,
          which counts the scrollbar the page always shows and would scroll
          the page sideways. On a desktop it is a card on the axis. */}
      <article className='w-[calc(100%+2rem)] max-w-[68.5rem] overflow-hidden border-y border-zinc-200 bg-white lg:w-full lg:rounded-[0.875rem] lg:border-x dark:border-zinc-800 dark:bg-zinc-950'>
        {pipe(
          post.coverImage,
          O.fold(
            () => null,
            (src) => (
              <img
                src={src}
                alt=''
                className='aspect-[100/42] w-full object-cover'
              />
            ),
          ),
        )}
        {/* Mirrored around the axis: back to the list on the left edge, the
            original on dev.to on the right. On a phone it is the bar at the
            bottom of the screen instead (`phoneBarView`). */}
        <nav
          aria-label='This post'
          className='hidden items-center justify-between lg:flex lg:px-[1rem] lg:pt-[1rem]'
        >
          <Link destination={blogDestination()} className={edgeLinkClass}>
            <ArrowLeft aria-hidden='true' className='size-[1rem]' />
            All posts
          </Link>
          <a {...newTabProps} href={post.devToUrl} className={edgeLinkClass}>
            dev.to
            <ArrowUpRight aria-hidden='true' className='size-[1rem]' />
          </a>
        </nav>
        <header className='flex flex-col items-center gap-[1rem] px-[1rem] pt-[1.75rem] text-center lg:gap-[1.25rem] lg:px-[4rem] lg:pt-[1.5rem]'>
          {isNewPost(post, newSince) ? newBadgeView() : null}
          <p className={blogMetaClass}>
            {blogDateView(post.date)} {'·'} {readingTimeOf(post.readingMinutes)}
          </p>
          <h1 className='text-[2rem] leading-[1.2] font-bold text-balance lg:text-[3rem]'>
            {post.title}
          </h1>
          {blogTagListView({ tagList: post.tagList })}
        </header>
        <div
          className='blog-prose px-[1rem] pt-[1.75rem] pb-[2.5rem] lg:px-[4rem] lg:pt-[3rem] lg:pb-[3.5rem]'
          onClick={bodyClickHandler(setGlobalMsg)}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        {discussionView({ post })}
      </article>
      {neighbourPostView({ slug: post.slug })}
      {phoneBarView({ post })}
    </div>
  )
}

export const BlogPostScreenMemo = memo(BlogPostScreen, PropsEq.equals)
