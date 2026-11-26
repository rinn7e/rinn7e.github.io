import { type Option } from 'fp-ts/Option'

// A post of the blog, as the build hands it to the app: read from its
// Markdown file in `content/blog/` and rendered to HTML by
// `tool/blog/post-list.ts`, served as the module `virtual:blog-post-list`
export type BlogPost = {
  // The name of its file, and its address on the site (`/blog/<slug>`)
  readonly slug: string
  readonly title: string
  readonly description: string
  // The day it was first published, `YYYY-MM-DD`
  readonly date: string
  readonly tagList: readonly string[]
  // How long it takes to read, in minutes, as dev.to counts it
  readonly readingMinutes: number
  // The original on dev.to, where its comments and reactions are (the
  // canonical address of the post is its page here)
  readonly devToUrl: string
  // A picture of the site (`/blog/<slug>/cover.png`), shown above the post
  readonly coverImage: Option<string>
  // The body, rendered at build time from the Markdown of the repository
  readonly html: string
}
