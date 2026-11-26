import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'

// The tags of a blog post, as dev.to spells them (`#elm`), centred: on the
// list of posts and on the page of a post. Plain labels, not links.
export const blogTagListView = ({
  tagList,
}: {
  readonly tagList: readonly string[]
}) => (
  <ul className='flex flex-wrap justify-center gap-[0.375rem]'>
    {pipe(
      tagList,
      RA.map((tag) => (
        <li
          key={tag}
          className='rounded-full bg-[#f0f2f5] px-[0.5rem] py-[0.125rem] text-[0.75rem] leading-[1.125rem] text-[#4b5159] dark:bg-zinc-800 dark:text-zinc-300'
        >
          #{tag}
        </li>
      )),
    )}
  </ul>
)
