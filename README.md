<p align="center">
  <img src="public/favicon.svg" alt="R7 logo" width="128" height="128">
</p>

<h1 align="center">rinn7e.com</h1>

<p align="center">
  The landing page of my open source products: browser extensions, web apps, games and developer tools.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml"><img src="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/rinn7e.github.io" alt="License: GPL-3.0"></a>
</p>

[rinn7e.com](https://rinn7e.com/) is laid out like a profile page: my photo, the counts of the products, highlights for the product categories (each filters the grid) and three tabs, Open-source work, Blog and About, with a Privacy page in the footer. The Open-source work tab is a grid of portrait playing cards, one per project, that tilt under the pointer. A click opens a popup: the card flies into it with a spin while a slideshow of its screenshots, a short description and its links (the live app, the browser stores, the code) fade in. The Blog tab lists my posts, newest first, each readable on its own page with a link to its original on [dev.to](https://dev.to/rinn7e). The About tab links my LinkedIn and my GitHub.

## Screenshot

![rinn7e.com](doc/screenshot.png)

## Add a product

1. Put its screenshots in `public/shot/<product id>/` as `1.webp`, `2.webp` and so on (at most 1200 px wide).
2. Put its logo in `public/logo/`, or give it a monogram if it has no logo of its own.
3. Add an entry to `productList` in `src/common/data/product.ts`: its id, name, kind, description, categories, logo, color, screenshots and links.

Only public repositories go here, and no libraries.

## Add a blog post

The posts are copies of my posts on [dev.to](https://dev.to/rinn7e): one Markdown file each in `content/blog/<slug>.md`, with a front matter (the title, the description, the day, the tags, the dev.to address as the canonical URL and the dev.to id), then the body as written on dev.to. Their pictures are in `public/blog/<slug>/`, so the site shows them from itself.

```bash
pnpm run blog:import
```

The import reads every post through the public API of dev.to, writes its file and saves its pictures. A post imported before keeps its file and its slug (rename the file to change its address); a new one gets the slug of dev.to without its random ending. Read the diff before committing. The build renders the Markdown to HTML, with the code colored by highlight.js (`tool/blog/`), so the browser gets no Markdown code. Prettier leaves `content/` alone, so a post stays as written.

## Development

Built with React and [`react-tea-cup`](https://github.com/vankeisb/react-tea-cup) (The Elm Architecture), `fp-ts`, Tailwind CSS v4 and Vite. The code follows [`doc/code-convention.md`](doc/code-convention.md).

Needs Node.js 24 and pnpm.

```bash
pnpm install
```

```bash
pnpm dev
```

Checks, as the deploy runs them:

```bash
pnpm run check && pnpm run lint && pnpm run format:check && pnpm test
```

## Deploy

GitHub Pages serves `dist/` at [rinn7e.com](https://rinn7e.com/). `.github/workflows/deploy.yml` checks, builds and deploys every push to `master`. The custom domain is set in the Pages settings of the repository, with "GitHub Actions" as the source. The build writes a copy of the app with its own title, description and canonical URL at `blog/index.html`, `about/index.html`, `privacy/index.html` and `blog/<slug>/index.html` for each post (its canonical URL is its original on dev.to, and it stays out of the sitemap), a `404.html` left out of search, and `sitemap.xml`, so a link straight to `/about` or to a post loads the app and search engines see every page (see "Search engines" in `doc/code-convention.md`).

The other GitHub Pages projects of `rinn7e` (such as `/claude-desktop-theme-tuner/`) are served under this domain by their own repositories, so no route of this site may use their names.

## License

The code is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
