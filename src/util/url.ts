import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { Cmd } from 'tea-cup-fp'

import {
  type Destination,
  DestinationEq,
  parseDestination,
  toUrlString,
} from '@/common/type/destination'
import { pushUrlCmd, replaceUrlCmd, savedScrollOfEntry } from '@/common/util'
import { type Model, type Msg } from '@/type'

import { destinationOf } from './destination'

// The URL is an adapter at the edges: written from the destination
// (`destinationOf`, read from the models) after every step, read only at
// boot and on the browser's back and forward (`UrlChanged`).
// `toUrlString` / `parseDestination` are the only code that knows its
// spelling.
// A push that does not move the page (`saveScroll`: anything but a move
// by a link) keeps the scroll of the entry it leaves first.
export type UrlWrite =
  | {
      readonly _tag: 'PushUrl'
      readonly url: string
      readonly saveScroll: boolean
    }
  | { readonly _tag: 'ReplaceUrl'; readonly url: string }

// How the browser's history follows a step: every change of destination
// pushes an entry (a move, or a product opened or closed in place), so the browser's
// back returns to the destination before. The same destination writes
// nothing. The browser's own move (`UrlChanged`) already has its entry and
// writes nothing.
export const urlWriteOf = (
  msg: Msg,
  prevModel: Model,
  model: Model,
): O.Option<UrlWrite> => {
  if (msg._tag === 'NavigationMsg' && msg.subMsg._tag === 'UrlChanged') {
    return O.none
  } else if (
    DestinationEq.equals(destinationOf(prevModel), destinationOf(model))
  ) {
    return O.none
  } else {
    return O.some({
      _tag: 'PushUrl',
      url: toUrlString(destinationOf(model)),
      saveScroll: !(
        msg._tag === 'NavigationMsg' && msg.subMsg._tag === 'Navigate'
      ),
    })
  }
}

// The destination the app boots on: the page's URL
export const bootDestinationOf = (location: Location): Destination =>
  parseDestination(location.href)

// The URL the boot's entry is corrected to when the page's URL is another
// spelling of its destination (`/about/`, an unknown product). A page that
// is not found keeps the URL it was opened with.
export const bootUrlOf = (
  location: Location,
  destination: Destination,
): O.Option<string> => {
  const url = toUrlString(destination)
  if (
    destination.screen._tag === 'NotFoundScreen' ||
    url === location.pathname + location.search
  ) {
    return O.none
  } else {
    return O.some(url)
  }
}

// The browser's back or forward landed on `location`: opened as a move,
// with the scroll saved in the entry it landed on (already the state of
// the history when `popstate` fires)
export const urlChangedMsg = (location: Location): Msg => ({
  _tag: 'NavigationMsg',
  subMsg: {
    _tag: 'UrlChanged',
    destination: parseDestination(location.href),
    scrollY: savedScrollOfEntry(),
  },
})

// Keeps the URL in sync with the destination (see `urlWriteOf`). The one
// wrapper around the root `update` (`program.tsx`): see "No update wrapper"
// in the code convention.
export const withUrl = (
  msg: Msg,
  prevModel: Model,
  [model, cmd]: [Model, Cmd<Msg>],
): [Model, Cmd<Msg>] =>
  pipe(
    urlWriteOf(msg, prevModel, model),
    O.fold(
      (): [Model, Cmd<Msg>] => [model, cmd],
      (write): [Model, Cmd<Msg>] => [
        model,
        Cmd.batch([
          write._tag === 'PushUrl'
            ? pushUrlCmd(write.url, write.saveScroll)
            : replaceUrlCmd(write.url),
          cmd,
        ]),
      ],
    ),
  )
