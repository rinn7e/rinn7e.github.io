import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as Ord from 'fp-ts/Ord'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as S from 'fp-ts/string'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { type BlogPost } from '../../src/common/type/blog-post'
import { type PostFile, decodePostFile } from './front-matter'
import { renderMarkdown } from './render'

// The posts of the blog: one Markdown file per post in `content/blog/`,
// named by its slug (`tool/import-dev-to.ts` writes them)
export const BLOG_CONTENT_DIR = 'content/blog'

// The address of a post on the site. The app spells it in
// `src/common/type/destination/parser.ts`; a test holds the two together.
export const blogPostPathOf = (slug: string): string => `/blog/${slug}`

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/

type NamedPostFile = {
  readonly slug: string
  readonly file: PostFile
}

// A file that cannot be read stops the build, with the name of the file
// and why
const readPostFile = (dir: string, name: string): NamedPostFile => {
  const slug = name.replace(/\.md$/, '')
  return pipe(
    slugPattern.test(slug)
      ? decodePostFile(readFileSync(join(dir, name), 'utf8'))
      : E.left('its name is not a slug (lowercase words joined by -)'),
    E.map((file) => ({ slug, file })),
    E.getOrElse((reason): NamedPostFile => {
      throw new Error(`${BLOG_CONTENT_DIR}/${name}: ${reason}`)
    }),
  )
}

const newestFirst: Ord.Ord<BlogPost> = pipe(
  S.Ord,
  Ord.reverse,
  Ord.contramap((post: BlogPost) => post.date),
)

// The Markdown files of `content/blog/` in `rootDir`
export const blogPostFileList = (rootDir: string): readonly string[] => {
  const dir = join(rootDir, BLOG_CONTENT_DIR)
  return existsSync(dir)
    ? pipe(
        readdirSync(dir),
        RA.filter((name) => name.endsWith('.md')),
        RA.map((name) => join(dir, name)),
      )
    : []
}

// Every post of `content/blog/` in `rootDir`, rendered, newest first
export const readBlogPostList = (rootDir: string): readonly BlogPost[] => {
  const dir = join(rootDir, BLOG_CONTENT_DIR)
  const namedList = pipe(
    blogPostFileList(rootDir),
    RA.map((path) => readPostFile(dir, path.slice(dir.length + 1))),
  )
  const localLinkMap = new Map(
    pipe(
      namedList,
      RA.map(({ slug, file }): [string, string] => [
        file.frontMatter.canonicalUrl.replace(/\/$/, ''),
        blogPostPathOf(slug),
      ]),
    ),
  )
  return pipe(
    namedList,
    RA.map(({ slug, file: { frontMatter, body } }): BlogPost => ({
      slug,
      title: frontMatter.title,
      description: frontMatter.description,
      date: frontMatter.date,
      tagList: frontMatter.tags,
      canonicalUrl: frontMatter.canonicalUrl,
      coverImage: O.fromNullable(frontMatter.coverImage),
      html: renderMarkdown(body, localLinkMap),
    })),
    RA.sort(newestFirst),
  )
}
