import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { neighbourPostsOf } from '@/common/data/blog'
import { type BlogPost } from '@/common/type/blog-post'
import { blogPostDestination } from '@/common/type/destination'
import { blogMetaClass } from '@/component/blog/meta'
import { Link } from '@/component/link'

// Under a post, the posts on either side of it, mirrored around the axis:
// the newer one on the left, the older one on the right, two equal cards.
// At either end of the list the one card left stays on the axis, at the
// width of one.

type Neighbour = {
  readonly post: BlogPost
  readonly side: 'Newer' | 'Older'
}

const neighbourCardView = ({ post, side }: Neighbour) => (
  <Link
    key={post.slug}
    destination={blogPostDestination(post.slug)}
    className='flex flex-col items-center gap-[0.5rem] rounded-[0.875rem] border border-zinc-200 bg-white px-[1.25rem] py-[1.25rem] text-center transition-colors hover:border-blue-600 lg:w-[calc(50%-0.5rem)] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-400'
  >
    <span className={`flex items-center gap-[0.375rem] ${blogMetaClass}`}>
      {side === 'Newer' ? (
        <ArrowLeft aria-hidden='true' className='size-[0.875rem]' />
      ) : null}
      {side === 'Newer' ? 'Newer post' : 'Older post'}
      {side === 'Older' ? (
        <ArrowRight aria-hidden='true' className='size-[0.875rem]' />
      ) : null}
    </span>
    <span className='text-[1rem] leading-[1.4] font-semibold text-balance lg:text-[1.125rem]'>
      {post.title}
    </span>
  </Link>
)

export const neighbourPostView = ({ slug }: { readonly slug: string }) => {
  const { newer, older } = neighbourPostsOf(slug)
  const neighbourList = pipe(
    [
      pipe(
        newer,
        O.map((post): Neighbour => ({ post, side: 'Newer' })),
      ),
      pipe(
        older,
        O.map((post): Neighbour => ({ post, side: 'Older' })),
      ),
    ],
    RA.compact,
  )
  return RA.isEmpty(neighbourList) ? null : (
    <nav
      aria-label='Other posts'
      className='flex w-full max-w-[68.5rem] flex-col gap-[1rem] lg:flex-row lg:justify-center'
    >
      {pipe(neighbourList, RA.map(neighbourCardView))}
    </nav>
  )
}
