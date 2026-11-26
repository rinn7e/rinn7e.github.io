import * as O from 'fp-ts/Option'
import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { blogPostList as builtBlogPostList } from 'virtual:blog-post-list'

import { type BlogPost } from '@/common/type/blog-post'

// The posts of the blog, newest first: the Markdown files of `content/blog/`,
// rendered by the build (`tool/blog/plugin.ts`). Each is a copy of a post of
// dev.to/rinn7e; its page here is its canonical address.
export const blogPostList: readonly BlogPost[] = builtBlogPostList

export const blogPostOf = (slug: string): Option<BlogPost> =>
  pipe(
    blogPostList,
    RA.findFirst((post) => post.slug === slug),
  )

// The posts on either side of a post in the list: the newer one before it,
// the older one after it, none at either end
export type NeighbourPosts = {
  readonly newer: Option<BlogPost>
  readonly older: Option<BlogPost>
}

export const neighbourPostsOf = (slug: string): NeighbourPosts =>
  pipe(
    blogPostList,
    RA.findIndex((post) => post.slug === slug),
    O.fold(
      (): NeighbourPosts => ({ newer: O.none, older: O.none }),
      (index) => ({
        newer: RA.lookup(index - 1)(blogPostList),
        older: RA.lookup(index + 1)(blogPostList),
      }),
    ),
  )

// Three letters each: the short month of `Intl` is `Sept` in English
const monthList = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// The day a post was published (`YYYY-MM-DD`), as a reader reads it
// (`27 Oct 2026`)
export const readableDateOf = (date: string): string => {
  const [year = '', month = '', day = ''] = date.split('-')
  return `${Number(day)} ${monthList[Number(month) - 1] ?? month} ${year}`
}

// How long a post shows as new, as an entry of TEA Ecosystem shows as
// recently added
export const NEW_POST_DAYS = 30

// The first day that still counts as new, `YYYY-MM-DD`, from `now` (ms
// since 1970, read once at boot): a local day of the reader, as the date of
// a post is a day, not a time
export const newSinceOf = (now: number): string => {
  const today = new Date(now)
  const since = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - NEW_POST_DAYS,
  )
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${since.getFullYear()}-${pad(since.getMonth() + 1)}-${pad(since.getDate())}`
}

// Its card and its page wear the badge New
export const isNewPost = (post: BlogPost, newSince: string): boolean =>
  post.date >= newSince
