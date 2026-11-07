/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
// A tea-cup Sub for media query changes, with its constructor parameter
// properties written out as fields, as this repo compiles with
// erasableSyntaxOnly.
import { Sub } from 'tea-cup-fp'

type Listener<E> = (ev: E) => any
type ListenerOptions = boolean | AddEventListenerOptions
type Mapper<E, Msg> = (ev: E) => Msg

let subCount = 0

export class MediaQuerySub<
  K extends keyof MediaQueryListEventMap,
  Msg,
> extends Sub<Msg> {
  private readonly listener: Listener<MediaQueryListEventMap[K]>
  private sc: number
  private mql: MediaQueryList | null = null
  private readonly mediaQueryEvents: MediaQueryEvents<Msg>
  private readonly key: K
  private readonly mapper: Mapper<MediaQueryListEventMap[K], Msg>
  private readonly options?: ListenerOptions

  constructor(
    mediaQueryEvents: MediaQueryEvents<Msg>,
    key: K,
    mapper: Mapper<MediaQueryListEventMap[K], Msg>,
    options?: ListenerOptions,
  ) {
    super()
    this.mediaQueryEvents = mediaQueryEvents
    this.key = key
    this.mapper = mapper
    this.options = options
    subCount++
    this.sc = subCount
    this.listener = (e) => {
      if (this.isActive()) {
        setTimeout(() => {
          this.dispatch(this.mapper(e))
        })
      }
    }
  }

  protected override onInit(): void {
    super.onInit()
    this.mql = this.mediaQueryEvents.doAddListener(
      this.key,
      this.listener,
      this.options,
    )
  }

  protected override onRelease(): void {
    super.onRelease()
    if (this.mql) {
      this.mediaQueryEvents.doRemoveListener(
        this.mql,
        this.key,
        this.listener,
        this.options,
      )
      this.mql = null
    }
  }
}

/**
 * Subscribe to media query events.
 */
export class MediaQueryEvents<Msg> {
  readonly query: string

  constructor(query: string) {
    this.query = query
  }

  doAddListener<K extends keyof MediaQueryListEventMap>(
    key: K,
    listener: (ev: MediaQueryListEventMap[K]) => any,
    options?: ListenerOptions,
  ): MediaQueryList | null {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return null
    }
    const mql = window.matchMedia(this.query)
    if (
      'addEventListener' in mql &&
      typeof mql.addEventListener === 'function'
    ) {
      if (options !== undefined) {
        mql.addEventListener(key, listener, options)
      } else {
        mql.addEventListener(key, listener)
      }
    } else if (
      'addListener' in mql &&
      typeof (mql as any).addListener === 'function'
    ) {
      ;(mql as any).addListener(listener)
    }
    return mql
  }

  doRemoveListener<K extends keyof MediaQueryListEventMap>(
    mql: MediaQueryList,
    key: K,
    listener: (ev: MediaQueryListEventMap[K]) => any,
    options?: ListenerOptions,
  ): void {
    if (
      'removeEventListener' in mql &&
      typeof mql.removeEventListener === 'function'
    ) {
      if (options !== undefined) {
        mql.removeEventListener(key, listener, options)
      } else {
        mql.removeEventListener(key, listener)
      }
    } else if (
      'removeListener' in mql &&
      typeof (mql as any).removeListener === 'function'
    ) {
      ;(mql as any).removeListener(listener)
    }
  }

  /**
   * Subscribe to a media query event.
   * @param key the event type to subscribe to (e.g. 'change').
   * @param mapper map the event to a message.
   * @param options options for this listener.
   */
  public on<K extends keyof MediaQueryListEventMap>(
    key: K,
    mapper: Mapper<MediaQueryListEventMap[K], Msg>,
    options?: ListenerOptions,
  ): Sub<Msg> {
    return new MediaQuerySub<K, Msg>(this, key, mapper, options)
  }

  /**
   * Subscribe to media query 'change' event.
   * @param mapper map the change event to a message.
   * @param options options for this listener.
   */
  public onChange(
    mapper: Mapper<MediaQueryListEvent, Msg>,
    options?: ListenerOptions,
  ): Sub<Msg> {
    return this.on('change', mapper, options)
  }
}

/**
 * Helper function to subscribe to media query changes directly.
 */
export function onMediaQuery<Msg>(
  query: string,
  mapper: (e: MediaQueryListEvent) => Msg,
  options?: ListenerOptions,
): Sub<Msg> {
  return new MediaQueryEvents<Msg>(query).onChange(mapper, options)
}
