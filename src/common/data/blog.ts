import { type Option } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { blogPostList as builtBlogPostList } from 'virtual:blog-post-list'

import { type BlogPost } from '@/common/type/blog-post'

// The posts of the blog, newest first: the Markdown files of `content/blog/`,
// rendered by the build (`tool/blog/plugin.ts`). Each is a copy of a post of
// dev.to/rinn7e, which stays its canonical address.
export const blogPostList: readonly BlogPost[] = builtBlogPostList

export const blogPostOf = (slug: string): Option<BlogPost> =>
  pipe(
    blogPostList,
    RA.findFirst((post) => post.slug === slug),
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
