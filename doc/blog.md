# Blog posts

How a post of [rinn7e.com/blog](https://rinn7e.com/blog) is written, published here and on dev.to, and linked both ways.

## Write a post

Each post is one Markdown file, `content/blog/<slug>.md`: a front matter, then the body. The slug is its address, `/blog/<slug>`.

```yaml
---
title: Command Sourcing vs Event Sourcing
description: One or two sentences, shown in the list and in link previews.
date: 2026-11-26
tags:
  - architecture
  - database
---
```

Its pictures go in `public/blog/<slug>/`, and the body links them as `/blog/<slug>/<name>.<ext>`. A picture may also have a version for the dark theme, `<name>.dark.<ext>` next to it: the page then shows the one that matches the theme of the system. A picture without one is shown in both themes.

The code examples of a post are in Haskell. The build renders the Markdown to HTML, with the code colored by highlight.js (`tool/blog/`), so the browser gets no Markdown code. Raw HTML in a post is shown as text. Prettier leaves `content/` alone, so a post stays as written.

## Publish a new post (required: here and on dev.to)

Every new post lives in both places, linked both ways: the page here is the original, and dev.to has a copy that points back to it. A post is not done until all of these steps are:

1. Write the post (see "Write a post") and push it. Wait for the deploy, then open `https://rinn7e.com/blog/<slug>/` and check it.
2. Publish the copy on [dev.to](https://dev.to/new) with the same title, the same description and the same tags (dev.to takes at most 4).
3. Give the copy the canonical URL `https://rinn7e.com/blog/<slug>/` (`canonical_url` in the front matter of the editor of dev.to), so search engines count the post here.
4. Give its pictures absolute addresses, as PNG or WebP. dev.to serves an SVG with the type `image/webp`, and browsers do not draw it. Render each picture to PNG (the light version) and upload it in the editor of dev.to; check them in its Preview before publishing.
5. Add `devToUrl: <the address of the copy on dev.to>` to the front matter of the post here, and push. Its page then shows a dev.to link and "Join the discussion on dev.to". Do not add `devToId`: the import would then replace the file with the copy.
6. Check both sides: the page here links the copy, and the API of dev.to (`https://dev.to/api/articles/rinn7e/<its dev.to slug>`) shows it published with the right `canonical_url`.

Keep the title the same on both sides: the import leaves a post without `devToId` alone and skips the dev.to post of the same slug, but a copy under another title would come back as a second file.

## Import the older posts from dev.to

The older posts were first written on [dev.to](https://dev.to/rinn7e) and are copied here, with `devToUrl` and `devToId` in their front matter. Their pictures are in `public/blog/<slug>/`, so the site shows them from itself.

```bash
pnpm run blog:import
```

The import reads every post through the public API of dev.to, writes its file and saves its pictures. A post imported before keeps its file and its slug (rename the file to change its address); a new one gets the slug of dev.to without its random ending. Read the diff before committing.

## Canonical URL

Each post names its page here as its canonical URL, and its copy on dev.to points back to it, so search engines count the post on this site.
