import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { memo } from 'react'

import { blogPostList } from '@/common/data/blog'
import { type BlogPost } from '@/common/type/blog-post'
import { blogPostDestination } from '@/common/type/destination'
import {
  blogDateView,
  blogMetaClass,
  readingTimeOf,
} from '@/component/blog/meta'
import { blogTagListView } from '@/component/blog/tag-list'
import { Link } from '@/component/link'

import { type Props, PropsEq } from './type'

// The posts, newest first, a centred column of equal cards, each opening
// its page. Its model is empty (`type.ts`), so the memo draws it once. It
// sits under the profile, so it has no title of its own.
const BlogScreen = (_props: Props) => (
  <div className='flex flex-col items-center pt-[2rem] pb-[6rem] lg:pt-[2.5rem]'>
    {RA.isEmpty(blogPostList) ? (
      <p className='text-[0.9375rem] text-zinc-600 dark:text-zinc-400'>
        No posts yet.
      </p>
    ) : (
      <ul className='flex w-full max-w-[45rem] flex-col gap-[1rem]'>
        {pipe(
          blogPostList,
          RA.map((post) => postCardView({ post })),
        )}
      </ul>
    )}
  </div>
)

// A card of the list, mirrored around its axis: the day on the left edge
// and the minutes to read on the right, then the title, the description and
// the tags, centred. Every card has the same frame.
const postCardView = ({ post }: { readonly post: BlogPost }) => (
  <li key={post.slug} className='flex'>
    <Link
      destination={blogPostDestination(post.slug)}
      className='flex w-full flex-col gap-[0.75rem] rounded-[0.875rem] border border-zinc-200 bg-white px-[1.25rem] py-[1rem] text-center transition-colors hover:border-blue-600 lg:px-[1.5rem] lg:py-[1.25rem] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-400'
    >
      <div className={`flex items-center justify-between ${blogMetaClass}`}>
        {blogDateView(post.date)}
        <span>{readingTimeOf(post.readingMinutes)}</span>
      </div>
      <div className='flex flex-col items-center gap-[0.625rem] px-[0.5rem] pb-[0.5rem] lg:px-[2rem]'>
        <h2 className='text-[1.25rem] leading-[1.3] font-bold text-balance lg:text-[1.625rem]'>
          {post.title}
        </h2>
        <p className='text-[0.875rem] leading-[1.6] text-balance text-zinc-600 lg:text-[1rem] dark:text-zinc-400'>
          {post.description}
        </p>
        {blogTagListView({ tagList: post.tagList })}
      </div>
    </Link>
  </li>
)

export const BlogScreenMemo = memo(BlogScreen, PropsEq.equals)
