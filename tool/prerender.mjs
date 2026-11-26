// Renders every page of the site to HTML ahead of time, after `vite build`
// (the client, in `dist/`, with a copy of `index.html` for each page and
// its own title, description and canonical URL, from the plugin of
// `vite.config.ts`) and `vite build --ssr src/prerender.tsx` (the
// renderer, in `dist-ssr/`), as TEA Ecosystem does. Each page gets its
// content in its root and the time it was rendered with
// (`src/common/util/boot.ts`), so the browser hydrates it. Each page also
// gets its share card, the PNG its `og:image` names (`src/share-card.tsx`,
// drawn with satori and resvg). `dist/404.html` stays the empty page.
//
// Run by `pnpm run build`.
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import satori from 'satori'

import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  bootScriptOf,
  pageList,
  productList,
  renderPage,
  shareCardView,
  shareImageList,
} from '../dist-ssr/prerender.js'

const DIST = 'dist'
const EMPTY_ROOT = '<div id="root"></div>'

const boot = { now: Date.now() }

// `/` is `dist/index.html`, `/blog/` is `dist/blog/index.html`
const fileOf = (pagePath) =>
  path.join(DIST, pagePath.replace(/^\//, ''), 'index.html')

pageList.forEach((page) => {
  const file = fileOf(page.path)
  const html = readFileSync(file, 'utf8')
  if (!html.includes(EMPTY_ROOT)) {
    throw new Error(`prerender: ${file} has no empty ${EMPTY_ROOT}`)
  }
  writeFileSync(
    file,
    html.replace(
      EMPTY_ROOT,
      `<div id="root">${renderPage(page.path, boot)}</div>${bootScriptOf(boot)}`,
    ),
  )
})

// The share cards. Inter stands in for the system font of the site (the
// fonts are read at build time only, never served).
const fonts = [400, 600, 800].map((weight) => ({
  name: 'Inter',
  weight,
  style: 'normal',
  data: readFileSync(
    `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`,
  ),
}))

const dataUrlOf = (type, data) =>
  `data:${type};base64,${Buffer.from(data).toString('base64')}`

// The R7 logo of the site, at the top of every card
const brandLogoSrc = dataUrlOf(
  'image/svg+xml',
  readFileSync('public/favicon.svg'),
)

const logoSrcMap = new Map(
  productList
    .filter((product) => product.logo._tag === 'ImageLogo')
    .map((product) => {
      const file = path.join('public', product.logo.src)
      return [
        product.id,
        dataUrlOf(
          file.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          readFileSync(file),
        ),
      ]
    }),
)

const logoSrcOf = (product) => logoSrcMap.get(product.id)

const pngOf = async (card) =>
  new Resvg(
    await satori(shareCardView({ card, brandLogoSrc, logoSrcOf }), {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      fonts,
    }),
    { fitTo: { mode: 'width', value: SHARE_IMAGE_WIDTH } },
  )
    .render()
    .asPng()

await Promise.all(
  shareImageList.map(async (image) => {
    const file = path.join(DIST, image.path)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, await pngOf(image.card))
  }),
)

console.log(
  `prerender: ${pageList.length} pages, ${shareImageList.length} share cards`,
)
