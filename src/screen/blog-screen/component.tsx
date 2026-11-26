import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { memo } from 'react'

import { blogPostList, readableDateOf } from '@/common/data/blog'
import { type BlogPost } from '@/common/type/blog-post'
import { blogPostDestination } from '@/common/type/destination'
import { blogTagListView } from '@/component/blog-tag-list'
import { Link } from '@/component/link'

import { type Props, PropsEq } from './type'

// The posts, newest first, each a card on the centre axis that opens its
// page: the day, the title, the description and the tags. Its model is
// empty (`type.ts`), so the memo draws it once. It sits under the profile,
// so it has no title of its own.
const BlogScreen = (_props: Props) => (
  <div className='flex flex-col items-center pt-[2rem] pb-[6rem] lg:pt-[2.5rem]'>
    {RA.isEmpty(blogPostList) ? (
      <p className='text-[0.9375rem] text-zinc-600 dark:text-zinc-400'>
        No posts yet.
      </p>
    ) : (
      <ul className='flex w-full max-w-[42.5rem] flex-col gap-[1rem]'>
        {pipe(
          blogPostList,
          RA.map((post) => postCardView({ post })),
        )}
      </ul>
    )}
  </div>
)

const postCardView = ({ post }: { readonly post: BlogPost }) => (
  <li key={post.slug} className='flex'>
    <Link
      destination={blogPostDestination(post.slug)}
      className='flex w-full flex-col items-center gap-[0.625rem] rounded-[0.875rem] border border-zinc-200 bg-white px-[1.25rem] py-[1.25rem] text-center transition-colors hover:border-blue-600 lg:px-[2.5rem] lg:py-[1.75rem] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-400'
    >
      <time
        dateTime={post.date}
        className='text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase dark:text-zinc-400'
      >
        {readableDateOf(post.date)}
      </time>
      <h2 className='text-[1.125rem] leading-[1.4] font-semibold text-balance lg:text-[1.25rem]'>
        {post.title}
      </h2>
      <p className='text-[0.875rem] leading-[1.6] text-balance text-zinc-600 dark:text-zinc-400'>
        {post.description}
      </p>
      {blogTagListView({ tagList: post.tagList })}
    </Link>
  </li>
)

export const BlogScreenMemo = memo(BlogScreen, PropsEq.equals)
