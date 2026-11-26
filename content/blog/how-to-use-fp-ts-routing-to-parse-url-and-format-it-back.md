---
title: How to use fp-ts-routing to parse url and format it back
description: fp-ts-routing kinda lacks comprehensive documentation, so I am writing this blog post to address that...
date: 2026-03-08
tags:
  - typescript
  - routing
canonicalUrl: https://dev.to/rinn7e/how-to-use-fp-ts-routing-to-parse-url-and-format-it-back-3lbm
devToId: 3326307
---

`fp-ts-routing` kinda lacks comprehensive documentation, so I am writing this blog post to address that gap.

If anyone doesn't know what it is, you can check the library here (it's pretty powerful library even though it's a bit old):
- [https://github.com/gcanti/fp-ts-routing](https://github.com/gcanti/fp-ts-routing)
- [https://gcanti.github.io/fp-ts-routing/](https://gcanti.github.io/fp-ts-routing/)

My goal is to achieve the following:

* Map a **URL string** (including query parameters) to **app route type**.
* Map **app route type** back to a **URL string**.

I will define these two functions as:

* `parseAppRoute`
* `toUrlString`

## Note

I have to use my patch here [https://github.com/rinn7e/fp-ts-routing](https://github.com/rinn7e/fp-ts-routing) which replaces `.then` with `.and`. The main reason is that `.then` seems
to be a reserved method in `vitest` and will cause the test to hangs forever.

If you don't use `vitest`, using `.then` should be fine.



## Requirement

This tutorial aims for those who are already familiar with TypeScript and basic functional programming concepts (Option, Matcher).

Libraries needed:
- `fp-ts`: `npm install fp-ts`
- `fp-ts-routing`: `npm install github:rinn7e/fp-ts-routing`
- `io-ts`: `npm install io-ts` (for query parameter validation)
- `vitest`: `npm install vitest --save-dev` (for testing)

You can see the sample code and test here: [https://github.com/rinn7e/my-blog/tree/master/6-how-to-use-fp-ts-routing](https://github.com/rinn7e/my-blog/tree/master/6-how-to-use-fp-ts-routing)

## Defining Types

First, we need to define our page types and the overall app route structure. We will use a discriminated union for different pages.

```typescript
import * as O from 'fp-ts/lib/Option'
import { Option } from 'fp-ts/lib/Option'

export type RoomId = string
export type ChatId = string
export type RoomCategory = 'active' | 'archived' | 'deleted'

export type RoomPage = {
  readonly _tag: 'RoomPage'
  roomId: Option<RoomId>
  chatId: Option<ChatId>
  category: RoomCategory
}

export type SearchPage = {
  readonly _tag: 'SearchPage'
  roomId: Option<RoomId>
  searchText: string
}

export type NotFoundPage = {
  readonly _tag: 'NotFoundPage'
  path: string[]
}

export type AppPage = RoomPage | SearchPage | NotFoundPage

export type AppRoute = {
  page: AppPage
  sidebarOpen: boolean
}

export const defaultAppRoute: AppRoute = {
  page: { _tag: 'RoomPage', roomId: O.none, chatId: O.none, category: 'active' },
  sidebarOpen: false
}
```

## Defining Matches

We use `fp-ts-routing` matches to define the URL structure.

```typescript
import { lit, str, query, end, Match, Parser, Formatter, Route } from 'fp-ts-routing'
import * as t from 'io-ts'

// Match any number of string segments in the path.
// Used for the "not found" route to capture the invalid path.
const anyStrings = new Match<{ path: string[] }>(
  new Parser((r) => O.some([{ path: r.parts }, new Route([], r.query)])),
  new Formatter((r, a) => new Route(r.parts.concat(a.path), r.query)),
)

// Query parameters validation
// ?sidebar=<some-value->
const sharedParams = t.exact(t.partial({
  sidebar: t.string
}))

// ?category=<some-value->
const roomQuery = t.exact(t.partial({
  category: t.string
}))

// basic matches
// /
const roomBlankMatch = query(t.intersection([roomQuery, sharedParams])).and(end)

// /rooms/:roomId
const roomOneMatch = lit('rooms')
  .and(str('roomId'))
  .and(query(t.intersection([roomQuery, sharedParams])))
  .and(end)

// /rooms/:roomId/chats/:chatId
const roomChatMatch = lit('rooms')
  .and(str('roomId'))
  .and(lit('chats'))
  .and(str('chatId'))
  .and(query(t.intersection([roomQuery, sharedParams])))
  .and(end)

// /search?q=...&room_id=...
// ?q=<some-value->&room_id=<some-value->
const searchParams = t.partial({
  q: t.string,
  room_id: t.string
})

const searchMatch = lit('search')
  .and(query(t.intersection([searchParams, sharedParams])))
  .and(end)

// otherwise
const notFoundMatch = anyStrings.and(query(sharedParams)).and(end)
```

## Creating the Parser

Now we combine these matches into a single router using `.alt`.

```typescript
import { zero, parse, format } from 'fp-ts-routing'

const toRoute = (page: AppPage) => (p: any): AppRoute => ({
  page,
  sidebarOpen: p.sidebar === 'true'
})

const appRouter: Parser<AppRoute> = zero<AppRoute>()
  .alt(roomBlankMatch.parser.map(toRoute({ _tag: 'RoomPage', roomId: O.none, chatId: O.none, category: 'active' })))
  .alt(roomOneMatch.parser.map((p) => toRoute({
      _tag: 'RoomPage',
      roomId: O.some(p.roomId),
      chatId: O.none,
      category: (p.category as RoomCategory) || 'active'
    })(p)
  ))
  .alt(roomChatMatch.parser.map((p) => toRoute({
      _tag: 'RoomPage',
      roomId: O.some(p.roomId),
      chatId: O.some(p.chatId),
      category: (p.category as RoomCategory) || 'active'
    })(p)
  ))
  .alt(searchMatch.parser.map((p) => toRoute({
      _tag: 'SearchPage',
      roomId: p.room_id ? O.some(p.room_id) : O.none,
      searchText: p.q || ''
    })(p)
  ))
  .alt(notFoundMatch.parser.map((p) => toRoute({ _tag: 'NotFoundPage', path: p.path })(p)))
```

## The 2 Core Functions

Finally, we implement `parseAppRoute` and `toUrlString`.

### 1. parseAppRoute

This function takes the current URL href and converts it into our `AppRoute` type.

```typescript
export const parseAppRoute = (href: string): AppRoute => {
  return parse(appRouter, Route.parse(href), defaultAppRoute)
}
```

### 2. toUrlString

This function takes an `AppRoute` and generates the corresponding URL string.

```typescript
export const toUrlString = (route: AppRoute): string => {
  const params = { sidebar: route.sidebarOpen ? 'true' : undefined }

  switch (route.page._tag) {
    case 'RoomPage': {
      const roomParams = { ...params, category: route.page.category }
      if (O.isSome(route.page.roomId)) {
          if (O.isSome(route.page.chatId)) {
            return format(roomChatMatch.formatter, {
                ...roomParams,
                roomId: route.page.roomId.value,
                chatId: route.page.chatId.value
            })
          }
          return format(roomOneMatch.formatter, {
              ...roomParams,
              roomId: route.page.roomId.value
          })
      }
      return format(roomBlankMatch.formatter, roomParams)
    }
    case 'SearchPage': {
      return format(searchMatch.formatter, {
          ...params,
          q: route.page.searchText,
          room_id: O.toUndefined(route.page.roomId)
      })
    }
    case 'NotFoundPage': {
      return format(notFoundMatch.formatter, { ...params, path: route.page.path })
    }
    default:
      return '/'
  }
}
```

## Testing with Vitest

Testing is a crucial part of ensuring your routing logic works as expected. We use `Vitest` for running our tests.

```typescript
import { describe, it, expect } from 'vitest'
import { parseAppRoute, toUrlString, type AppRoute, type RoomPage, type SearchPage, type NotFoundPage } from '../src/route.js'
import * as O from 'fp-ts/lib/Option.js'

describe('Route parsing and generation', () => {
  it('should parse SearchPage correctly', () => {
    const route = parseAppRoute('/search?q=hello&room_id=room-123')
    expect(route.page._tag).toBe('SearchPage')
    const searchPage = route.page as SearchPage
    expect(searchPage.searchText).toBe('hello')
    expect(O.isSome(searchPage.roomId)).toBe(true)
  })

  it('should handle unknown paths with NotFoundPage', () => {
    const route = parseAppRoute('/unknown/path/here')
    expect(route.page._tag).toBe('NotFoundPage')
  })
})
```

## Conclusion


That's it for this tutorial. If you have any questions, feel free to comment below.

Thanks for reading
