import { join } from 'node:path'
import { type Plugin } from 'vite'

import { BLOG_CONTENT_DIR, readBlogPostList } from './post-list'

const VIRTUAL_ID = 'virtual:blog-post-list'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

// Serves the posts of `content/blog/`, rendered, as the module
// `virtual:blog-post-list` (`blogPostList`, newest first), read by
// `src/common/data/blog.ts`. In the dev server, a post added, changed or
// removed reloads the page.
export const blogPlugin = (): Plugin => {
  let rootDir = process.cwd()
  return {
    name: 'rinn7e-blog',
    configResolved(config) {
      rootDir = config.root
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      return id === RESOLVED_ID
        ? `export const blogPostList = ${JSON.stringify(readBlogPostList(rootDir))}\n`
        : undefined
    },
    configureServer(server) {
      const dir = join(rootDir, BLOG_CONTENT_DIR)
      const reload = (file: string) => {
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (file.startsWith(dir) && module !== undefined) {
          server.moduleGraph.invalidateModule(module)
          server.ws.send({ type: 'full-reload' })
        }
      }
      server.watcher.add(dir)
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)
    },
  }
}
