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

[rinn7e.com](https://rinn7e.com/) shows each product with a screenshot, a short description and its links (the live app, the browser stores, the code), with a filter by category. The About page links my LinkedIn, my GitHub and my casual personal site, [me.rinn7e.com](https://me.rinn7e.com/) (its code is in [`rinn7e/me`](https://github.com/rinn7e/me)).

## Screenshot

![rinn7e.com](doc/screenshot.png)

## Add a product

1. Put a screenshot in `public/shot/` (WebP, at most 1200 px wide).
2. Add an entry to `productList` in `src/common/data/product.ts`: its name, kind, description, categories, image and links.

Only public repositories go here, and no libraries.

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

GitHub Pages serves `dist/` at [rinn7e.com](https://rinn7e.com/). `.github/workflows/deploy.yml` checks, builds and deploys every push to `master`. The custom domain is set in the Pages settings of the repository, with "GitHub Actions" as the source. The build copies `index.html` to `about/index.html` and `404.html`, so a link straight to `/about` loads the app.

The other GitHub Pages projects of `rinn7e` (such as `/claude-desktop-theme-tuner/`) are served under this domain by their own repositories, so no route of this site may use their names.

## License

The code is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
