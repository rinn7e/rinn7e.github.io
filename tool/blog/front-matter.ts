import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import { parse, stringify } from 'yaml'

// The front matter of a post in `content/blog/<slug>.md`: the YAML between
// the two `---` lines at the top of the file, then the Markdown body.
// Read by the build (`post-list.ts`) and written by the import from dev.to
// (`tool/import-dev-to.ts`), so both hold the file to this one codec.

interface IsoDateBrand {
  readonly IsoDate: unique symbol
}

// A day, `YYYY-MM-DD`
const IsoDate = t.brand(
  t.string,
  (text): text is t.Branded<string, IsoDateBrand> =>
    /^\d{4}-\d{2}-\d{2}$/.test(text),
  'IsoDate',
)

export const FrontMatter = t.intersection([
  t.type({
    title: t.string,
    description: t.string,
    date: IsoDate,
    tags: t.array(t.string),
  }),
  // Both absent on a post first published here, not on dev.to
  t.partial({
    // The original on dev.to, where its comments and reactions are
    devToUrl: t.string,
    // The id of the post on dev.to, so a new import keeps its file (and its
    // slug) even when its title changed there
    devToId: t.number,
    // A picture of the site, `/blog/<slug>/cover.<ext>`
    coverImage: t.string,
  }),
])

export type FrontMatter = t.TypeOf<typeof FrontMatter>

export type PostFile = {
  readonly frontMatter: FrontMatter
  readonly body: string
}

const frontMatterPattern = /^---\n([\s\S]*?)\n---\n/

// The front matter and the body of a post file, or why it cannot be read
export const decodePostFile = (text: string): E.Either<string, PostFile> => {
  const normalized = text.replaceAll('\r\n', '\n')
  const match = frontMatterPattern.exec(normalized)
  if (match === null) {
    return E.left('no front matter between two --- lines at the top')
  } else {
    return pipe(
      E.tryCatch(
        (): unknown => parse(match[1] ?? ''),
        (error) => `the front matter is not YAML: ${String(error)}`,
      ),
      E.chain((data) => {
        const result = FrontMatter.decode(data)
        return pipe(
          result,
          E.mapLeft(
            () =>
              `the front matter does not fit: ${PathReporter.report(result).join('; ')}`,
          ),
        )
      }),
      E.map((frontMatter) => ({
        frontMatter,
        body: normalized.slice(match[0].length).replace(/^\n+/, ''),
      })),
    )
  }
}

// The text of a post file
export const postFileText = ({ frontMatter, body }: PostFile): string =>
  `---\n${stringify(FrontMatter.encode(frontMatter), { lineWidth: 0 })}---\n\n${body.trimEnd()}\n`
