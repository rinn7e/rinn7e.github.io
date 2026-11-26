import { readableDateOf } from '@/common/data/blog'

// The quiet uppercase label of the site (the section titles of Privacy, the
// buttons at the ends of the tabs), for what is said about a post
export const blogMetaClass =
  'text-[0.75rem] leading-[1.125rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase dark:text-zinc-400'

// The day a post was published
export const blogDateView = (date: string) => (
  <time dateTime={date}>{readableDateOf(date)}</time>
)

// How long a post takes to read (`9 min read`)
export const readingTimeOf = (readingMinutes: number): string =>
  `${readingMinutes} min read`
