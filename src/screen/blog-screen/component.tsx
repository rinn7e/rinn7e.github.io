import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { memo } from 'react'

import { blogPostList, isNewPost } from '@/common/data/blog'
import { type BlogPost } from '@/common/type/blog-post'
import { blogPostDestination } from '@/common/type/destination'
import {
  blogDateView,
  blogMetaClass,
  readingTimeOf,
} from '@/component/blog/meta'
import { newBadgeView } from '@/component/blog/new-badge'
import { blogTagListView } from '@/component/blog/tag-list'
import { Link } from '@/component/link'

import { type Props, PropsEq } from './type'

// The posts, newest first, in one card on the axis: a row per post, the
// rows divided by thin rules, each opening its page. Its model is empty (`type.ts`), so the memo draws it once. It
// sits under the profile, so it has no title of its own.
const BlogScreen = ({ newSince }: Props) => (
  <div className='flex flex-col items-center pt-[2rem] pb-[6rem] lg:pt-[2.5rem]'>
    {RA.isEmpty(blogPostList) ? (
      <p className='text-[0.9375rem] text-zinc-600 dark:text-zinc-400'>
        No posts yet.
      </p>
    ) : (
      // On a phone the card is a band across the whole screen, its column
      // plus the 1rem side padding of the page (the column is centred, so
      // it reaches past that padding on both sides alike), as the page of a
      // post; on a desktop it is a card on the axis
      <ul className='flex w-[calc(100%+2rem)] max-w-[45rem] flex-col divide-y divide-zinc-200 overflow-hidden border-y border-zinc-200 bg-white lg:w-full lg:rounded-[0.875rem] lg:border-x dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950'>
        {pipe(
          blogPostList,
          RA.map((post) =>
            postCardView({ post, isNew: isNewPost(post, newSince) }),
          ),
        )}
      </ul>
    )}
  </div>
)

// A row of the list, mirrored around its axis: the day on the left edge
// and the minutes to read on the right, then the title, the description and
// the tags, centred, and the badge New on the axis on a post of the last 30
// days. Every row has the same height: the title and the description each
// get a box of two lines, clamped to it, with a shorter text centred in it,
// so a long title never makes its row taller.
const postCardView = ({
  post,
  isNew,
}: {
  readonly post: BlogPost
  readonly isNew: boolean
}) => (
  <li key={post.slug} className='flex'>
    <Link
      destination={blogPostDestination(post.slug)}
      className='flex w-full flex-col gap-[0.75rem] px-[1.25rem] py-[1rem] text-center transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 lg:px-[1.5rem] lg:py-[1.25rem] dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100'
    >
      {/* Mirrored around the axis: the day on the left edge, the minutes
          to read on the right, and the badge New on the axis between them */}
      <div
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-[0.5rem] ${blogMetaClass}`}
      >
        <span className='justify-self-start'>{blogDateView(post.date)}</span>
        {isNew ? newBadgeView() : <span />}
        <span className='justify-self-end'>
          {readingTimeOf(post.readingMinutes)}
        </span>
      </div>
      <div className='flex flex-col items-center gap-[0.625rem] px-[0.5rem] pb-[0.5rem] lg:px-[2rem]'>
        <h2 className='flex min-h-[2.6em] items-center justify-center text-[1.25rem] leading-[1.3] font-bold text-balance lg:text-[1.625rem]'>
          <span className='line-clamp-2'>{post.title}</span>
        </h2>
        <p className='flex min-h-[3.2em] items-center justify-center text-[0.875rem] leading-[1.6] text-balance text-zinc-600 lg:text-[1rem] dark:text-zinc-400'>
          <span className='line-clamp-2'>{post.description}</span>
        </p>
        {blogTagListView({ tagList: post.tagList, oneRow: true })}
      </div>
    </Link>
  </li>
)

export const BlogScreenMemo = memo(BlogScreen, PropsEq.equals)
