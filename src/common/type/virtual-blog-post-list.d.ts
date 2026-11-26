// The posts of the blog, newest first, made at build time from
// `content/blog/` by the Vite plugin of `tool/blog/plugin.ts`
declare module 'virtual:blog-post-list' {
  import { type BlogPost } from '@/common/type/blog-post'

  export const blogPostList: readonly BlogPost[]
}
