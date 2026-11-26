<p align="center">
  <img src="public/favicon.svg" alt="R7 logo" width="128" height="128">
</p>

<h1 align="center">rinn7e.com</h1>

<p align="center">
  My open-source work and my blog.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml"><img src="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/rinn7e.github.io" alt="License: GPL-3.0"></a>
</p>

![rinn7e.com](doc/screenshot.png)

## Run it

React with [`react-tea-cup`](https://github.com/vankeisb/react-tea-cup) (The Elm Architecture), `fp-ts`, Tailwind CSS v4 and Vite. Needs Node.js 24 and pnpm.

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

Code convention: [`doc/code-convention.md`](doc/code-convention.md).

## Add a product

1. Put its screenshots in `public/shot/<product id>/` as `1.webp`, `2.webp` and so on (at most 1200 px wide).
2. Put its logo in `public/logo/`, or give it a monogram.
3. Add it to `productList` in `src/common/data/product.ts`.

Public repositories only, no libraries.

## Write a post

A post lives here and on dev.to, linked both ways: [`doc/blog.md`](doc/blog.md).

## Deploy

Every push to `master` is checked, built (each page prerendered, with its own share image) and deployed to GitHub Pages at [rinn7e.com](https://rinn7e.com/). The other GitHub Pages projects of `rinn7e` are served under this domain too, so no route here may use their names.

## License

[GPL-3.0](LICENSE).
