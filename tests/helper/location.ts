// A `Location` for `href`, as the browser gives it to `init` and
// `onUrlChange`
export const locationOf = (href: string): Location => {
  const url = new URL(href)
  return {
    ancestorOrigins: {
      length: 0,
      contains: () => false,
      item: () => null,
      [Symbol.iterator]: [][Symbol.iterator],
    },
    hash: url.hash,
    host: url.host,
    hostname: url.hostname,
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    search: url.search,
    assign: () => undefined,
    reload: () => undefined,
    replace: () => undefined,
    toString: () => url.href,
  }
}
