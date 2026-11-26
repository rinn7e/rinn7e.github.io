import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { type ProgramListener } from 'react-tea-cup'

import {
  type Destination,
  DestinationEq,
  parseDestination,
  toUrlString,
} from '@/common/type/destination'
import { pushUrl, replaceUrl, savedScrollOfEntry } from '@/common/util'
import { type Model, type Msg } from '@/type'

import { destinationOf } from './destination'

// The URL is an adapter at the edges: written from the destination (`destinationOf`,
// read from the models) after every step, by the one URL writer of the
// program (`urlWriterOf`), and read only at boot and on the browser's back
// and forward (`UrlChanged`). `toUrlString` / `parseDestination` are the
// only code that knows its spelling.
export type UrlWrite =
  | { readonly _tag: 'PushUrl'; readonly url: string }
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
    return O.some({ _tag: 'PushUrl', url: toUrlString(destinationOf(model)) })
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

// Keeps the URL in sync with the destination (see `urlWriteOf`): the
// listener of the program (`src/program.tsx`), which it calls with the
// model of `init` and then after every step, right after `update` and
// before React draws the step. So a push runs while the page left is still
// drawn at its scroll: the browser keeps that scroll, and Safari its
// snapshot, for the entry left (`doc/swipe-back.md`). It holds the model of
// the step before, to compare the destinations. Not a wrapper around
// `update`, and no `Cmd`: a command runs after React has drawn the step.
export const urlWriterOf = (): ProgramListener<Model, Msg> => {
  let prevModel: O.Option<Model> = O.none
  return (event) => {
    const [model] = event.mac
    if (event.tag === 'update') {
      pipe(
        prevModel,
        O.chain((prev) => urlWriteOf(event.msg, prev, model)),
        O.map((write) =>
          write._tag === 'PushUrl' ? pushUrl(write.url) : replaceUrl(write.url),
        ),
      )
    }
    prevModel = O.some(model)
  }
}
