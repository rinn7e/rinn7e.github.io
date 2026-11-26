// Copies the posts of dev.to/rinn7e into the repository: one Markdown file
// per post in `content/blog/<slug>.md` (front matter, then the body as
// written on dev.to), and the pictures of each post in `public/blog/<slug>/`,
// so the site shows them from itself (see "The privacy page" in
// `doc/code-convention.md`). A post imported before keeps its file and its
// slug (found by its dev.to id); a new one gets the slug of dev.to without
// its random ending. Run it with `pnpm run blog:import` (through the module
// runner of Vite, `tool/run.ts`), then read the diff.
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  FrontMatter,
  type PostFile,
  decodePostFile,
  postFileText,
} from './blog/front-matter'
import { repairMojibake } from './blog/mojibake'

const USERNAME = 'rinn7e'
const API_URL = 'https://dev.to/api'

// A tool of a public repository names itself and its repository, nothing
// about a person
const USER_AGENT =
  'rinn7e.github.io/1.0 (+https://github.com/rinn7e/rinn7e.github.io)'

const rootDir = new URL('..', import.meta.url).pathname
const contentDir = join(rootDir, 'content/blog')
const publicDir = join(rootDir, 'public/blog')

const ArticleSummary = t.type({ id: t.number })

const Article = t.type({
  id: t.number,
  title: t.string,
  description: t.string,
  slug: t.string,
  url: t.string,
  published_at: t.string,
  tags: t.array(t.string),
  cover_image: t.union([t.string, t.null]),
  body_markdown: t.string,
})

type Article = t.TypeOf<typeof Article>

const decodeOrThrow = <A>(
  codec: t.Decoder<unknown, A>,
  value: unknown,
  what: string,
): A => {
  const result = codec.decode(value)
  return pipe(
    result,
    E.getOrElse((): A => {
      throw new Error(`${what}: ${PathReporter.report(result).join('; ')}`)
    }),
  )
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const get = async (url: string): Promise<Response> => {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`)
  }
  return response
}

const getJson = async (url: string): Promise<unknown> => (await get(url)).json()

// The posts already in `content/blog/`: their slug, and their dev.to id
// when they were imported (a post first published here has none)
type KnownPost = {
  readonly slug: string
  readonly devToId: number | undefined
}

const knownPostList = async (): Promise<readonly KnownPost[]> => {
  await mkdir(contentDir, { recursive: true })
  const fileList = (await readdir(contentDir)).filter((name) =>
    name.endsWith('.md'),
  )
  const entryList = await Promise.all(
    fileList.map(async (name) =>
      pipe(
        decodePostFile(await readFile(join(contentDir, name), 'utf8')),
        E.map((file): KnownPost => ({
          slug: name.replace(/\.md$/, ''),
          devToId: file.frontMatter.devToId,
        })),
        E.getOrElse((reason): KnownPost => {
          throw new Error(`content/blog/${name}: ${reason}`)
        }),
      ),
    ),
  )
  return entryList
}

// dev.to ends every slug with a few random characters (`-h2j`)
const slugOfDevTo = (devToSlug: string): string =>
  devToSlug.replace(/-[a-z0-9]{3,4}$/, '')

const fileNameOf = (url: string): string =>
  (new URL(url).pathname.split('/').pop() ?? 'image').replace(
    /[^a-zA-Z0-9._-]/g,
    '-',
  )

// Saves the picture at `url` in `public/blog/<slug>/` and answers its
// address on the site
const download = async (
  url: string,
  slug: string,
  fileName: string,
): Promise<string> => {
  const bytes = new Uint8Array(await (await get(url)).arrayBuffer())
  await mkdir(join(publicDir, slug), { recursive: true })
  await writeFile(join(publicDir, slug, fileName), bytes)
  return `/blog/${slug}/${fileName}`
}

const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)/g

// The body with every picture from another host saved here and pointed to
const withLocalImages = async (body: string, slug: string): Promise<string> => {
  const urlList = pipe(
    [...body.matchAll(imagePattern)],
    RA.filterMap((match) => O.fromNullable(match[2])),
    RA.uniq({ equals: (x, y) => x === y }),
  )
  const localList = await Promise.all(
    urlList.map(async (url): Promise<[string, string]> => [
      url,
      await download(url, slug, fileNameOf(url)),
    ]),
  )
  return localList.reduce(
    (text, [url, local]) => text.replaceAll(`](${url}`, `](${local}`),
    body,
  )
}

// The body without the front matter of dev.to, with Unix line ends, and
// any text garbled by a wrong encoding on dev.to repaired
const bodyOf = (article: Article): string =>
  repairMojibake(article.body_markdown)
    .replaceAll('\r\n', '\n')
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/^\n+/, '')

const EXCERPT_LENGTH = 160

// The first paragraph of prose of the body as plain text, cut at a word
// near `EXCERPT_LENGTH`: the description of a post that has none on dev.to
const excerptOf = (body: string): string =>
  pipe(
    body.split(/\n\s*\n/),
    RA.map((paragraph) => paragraph.trim()),
    RA.findFirst(
      (paragraph) =>
        paragraph !== '' &&
        !/^(#|```|!\[|[-*+] |\d+\. |>|\||---)/.test(paragraph),
    ),
    O.map((paragraph) =>
      paragraph
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[`*_]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ),
    O.map((text) =>
      text.length <= EXCERPT_LENGTH
        ? text
        : `${text.slice(0, text.lastIndexOf(' ', EXCERPT_LENGTH))}...`,
    ),
    O.getOrElse(() => ''),
  )

const postFileOf = async (
  article: Article,
  slug: string,
): Promise<PostFile> => {
  const coverImage =
    article.cover_image === null
      ? {}
      : {
          coverImage: await download(
            article.cover_image,
            slug,
            `cover-${fileNameOf(article.cover_image)}`,
          ),
        }
  const body = bodyOf(article)
  const description = repairMojibake(article.description)
    .replace(/\s+/g, ' ')
    .trim()
  const frontMatter = decodeOrThrow(
    FrontMatter,
    {
      title: repairMojibake(article.title),
      description: description === '' ? excerptOf(body) : description,
      date: article.published_at.slice(0, 10),
      tags: article.tags,
      devToUrl: article.url,
      devToId: article.id,
      ...coverImage,
    },
    `the front matter of ${article.slug}`,
  )
  return {
    frontMatter,
    body: await withLocalImages(body, slug),
  }
}

const main = async () => {
  const knownList = await knownPostList()
  // The slug of the posts imported before, by their dev.to id
  const slugMap = new Map(
    knownList.flatMap(({ slug, devToId }): [number, string][] =>
      devToId === undefined ? [] : [[devToId, slug]],
    ),
  )
  // A post first published here is the original: a copy of it on dev.to
  // (same slug) never overwrites it
  const ownSlugSet = new Set(
    knownList
      .filter(({ devToId }) => devToId === undefined)
      .map(({ slug }) => slug),
  )
  const summaryList = decodeOrThrow(
    t.array(ArticleSummary),
    await getJson(
      `${API_URL}/articles?username=${USERNAME}&per_page=1000&page=1`,
    ),
    'the list of articles',
  )
  for (const summary of summaryList) {
    // dev.to limits how fast a client may ask
    await wait(500)
    const article = decodeOrThrow(
      Article,
      await getJson(`${API_URL}/articles/${summary.id}`),
      `article ${summary.id}`,
    )
    const slug = slugMap.get(article.id) ?? slugOfDevTo(article.slug)
    if (ownSlugSet.has(slug)) {
      console.log(`content/blog/${slug}.md  kept, first published here`)
      continue
    }
    const file = await postFileOf(article, slug)
    await writeFile(join(contentDir, `${slug}.md`), postFileText(file))
    console.log(`content/blog/${slug}.md  ${article.title}`)
  }
}

await main()
