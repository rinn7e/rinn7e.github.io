import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'

// The colors of the `#` of a tag, as dev.to colors each tag: picked from
// the name, so a tag always has the same one
const hashColorList = [
  'text-blue-600 dark:text-blue-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-violet-600 dark:text-violet-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
]

const hashColorOf = (tag: string): string =>
  hashColorList[
    pipe(
      [...tag],
      RA.reduce(0, (sum, char) => sum + (char.codePointAt(0) ?? 0)),
    ) % hashColorList.length
  ] ?? ''

// The tags of a blog post, as dev.to spells them (`#elm`), centred: on a
// card of the list and on the page of a post. Plain labels, not links.
// With `oneRow` (the cards of the list, which all have the same height),
// only the tags that fit on the first row show: the rest wrap to a second
// row that is cut off whole, so no tag is ever cut in half.
export const blogTagListView = ({
  tagList,
  oneRow = false,
}: {
  readonly tagList: readonly string[]
  readonly oneRow?: boolean
}) => (
  <ul
    className={`flex flex-wrap justify-center gap-x-[0.75rem] gap-y-[0.25rem] ${oneRow ? 'max-h-[1.25rem] overflow-hidden' : ''}`}
  >
    {pipe(
      tagList,
      RA.map((tag) => (
        <li
          key={tag}
          className='text-[0.8125rem] leading-[1.25rem] text-[#4b5159] lg:text-[1rem] dark:text-zinc-300'
        >
          <span className={hashColorOf(tag)}>#</span>
          {tag}
        </li>
      )),
    )}
  </ul>
)
