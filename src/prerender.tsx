import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'

import { blogPostList } from '@/common/data/blog'
import {
  SITE_URL,
  type SeoPage,
  blogPostImagePathOf,
  blogPostSeoPageOf,
  seoPageList,
  sitePageImagePathOf,
  sitePageList,
} from '@/common/seo'
import { type Boot } from '@/common/util/boot'
import { locationOfHref } from '@/common/util/location'

import { type ShareCard, pageShareCardOf, postShareCardOf } from './share-card'
import { init } from './update'
import { RootView } from './view'

// The build renders every page of the site to HTML ahead of time
// (`scripts/prerender.mjs`), as TEA Ecosystem does: a visitor sees the page
// before the script has loaded, and a search engine or a link preview
// reads its content. The script then hydrates it (`src/root.tsx`). Built
// for Node by `vite build --ssr src/prerender.tsx`.

export { bootScriptOf } from '@/common/util/boot'
export { productList } from '@/common/data/product'
export { SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from '@/common/seo'
export { shareCardView } from './share-card'

// Every page the build writes: the pages of `seoPageList` and one per post
export const pageList: readonly SeoPage[] = [
  ...seoPageList,
  ...pipe(blogPostList, RA.map(blogPostSeoPageOf)),
]

// The HTML of the page at `path` (`/blog/`), as the browser draws it first
// at the same `boot`: the root view of the model `init` gives, with no
// dispatch (nothing runs in Node)
export const renderPage = (path: string, boot: Boot): string => {
  const [model] = init(locationOfHref(`${SITE_URL}${path}`), boot.now)
  return renderToString(
    <StrictMode>
      <RootView model={model} dispatch={() => undefined} />
    </StrictMode>,
  )
}

// The share card of every page, at the path its `og:image` names
export type ShareImage = {
  readonly path: string
  readonly card: ShareCard
}

export const shareImageList: readonly ShareImage[] = [
  ...pipe(
    sitePageList,
    RA.map((page) => ({
      path: sitePageImagePathOf(page),
      card: pageShareCardOf(blogPostList.length)(page),
    })),
  ),
  ...pipe(
    blogPostList,
    RA.map((post) => ({
      path: blogPostImagePathOf(post.slug),
      card: postShareCardOf(post),
    })),
  ),
]
