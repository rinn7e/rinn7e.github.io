import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

import { htmlOfPage, seoPageList, sitemapXml } from './src/common/seo'

// What search engines read (`src/common/seo.ts`), written into the HTML:
// in the dev server, the first page; in a build, once the bundle has its
// asset links, a copy of the app for each page at its path (GitHub Pages
// serves `about/index.html` for `/about`), a `404.html` copy left out of
// search, and the sitemap.
const seoPlugin = (): Plugin => {
  let isBuild = false
  return {
    name: 'rinn7e-seo',
    // After the HTML plugin of Vite, which writes `index.html` into the bundle
    enforce: 'post',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    transformIndexHtml(html) {
      const [firstPage] = seoPageList
      return isBuild || firstPage === undefined
        ? html
        : htmlOfPage(html, firstPage)
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      const [firstPage] = seoPageList
      if (firstPage === undefined || index?.type !== 'asset') {
        return
      }
      const built = String(index.source)
      index.source = htmlOfPage(built, firstPage)
      seoPageList.slice(1).forEach((page) => {
        this.emitFile({
          type: 'asset',
          fileName: `${page.path.replace(/^\//, '')}index.html`,
          source: htmlOfPage(built, page),
        })
      })
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: htmlOfPage(built, firstPage, false),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: sitemapXml(),
      })
    },
  }
}

// Cloudflare Web Analytics, in the built site only, so a visit to the dev
// server is never counted. No cookies and no personal data, so no consent
// banner. The token is public (it ships in every page), and `spa` counts
// each move of the app as a page view. It is the token of the `rinn7e.com`
// site in Web Analytics, set to "Enable with JS Snippet installation": the
// traffic goes straight to GitHub Pages, so Cloudflare cannot inject it.
// The Privacy page names it (see "The privacy page" in the code convention).
const cloudflareWebAnalytics = (): Plugin => ({
  name: 'cloudflare-web-analytics',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: {
        defer: true,
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': JSON.stringify({
          token: '4aa2721b854f435d8dbd10a769b10b78',
          spa: true,
        }),
      },
      injectTo: 'body',
    },
  ],
})

// A static site with path routing (/, /about, /privacy), served at the root
// of rinn7e.com: asset paths are absolute, so a deep link finds them
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), cloudflareWebAnalytics(), seoPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5180 },
})
