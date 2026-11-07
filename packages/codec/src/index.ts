import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

// A string codec that only accepts values passing a check; `hint` is the
// error message
export const refinedString = (
  name: string,
  ok: (s: string) => boolean,
  hint: string,
) =>
  new t.Type<string, string, unknown>(
    name,
    (u): u is string => typeof u === 'string' && ok(u),
    (u, c) =>
      typeof u === 'string' && ok(u) ? t.success(u) : t.failure(u, c, hint),
    t.identity,
  )

// Readable messages for a failed decode: "basics.name: expected string, got 3".
// The keys io-ts adds for intersections and unions ("0", "1") are left out of
// the path.
export const decodeErrors = (errors: t.Errors): string[] =>
  errors.map((e) => {
    const path = e.context
      .filter((c, i) => {
        const parent = e.context[i - 1]?.type
        const inArray = parent instanceof t.ArrayType
        return c.key !== '' && (inArray || !/^\d+$/.test(c.key))
      })
      .map((c) => c.key)
      .join('.')
    const expected = e.message ?? `expected ${e.context.at(-1)?.type.name}`
    return `${path || '(root)'}: ${expected}, got ${JSON.stringify(e.value)}`
  })

export const decodeWith =
  <A>(codec: t.Decoder<unknown, A>) =>
  (u: unknown): E.Either<string[], A> =>
    pipe(codec.decode(u), E.mapLeft(decodeErrors))
