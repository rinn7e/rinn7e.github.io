<p align="center">
  <img src="site/favicon.svg" alt="R7 logo" width="128" height="128">
</p>

<h1 align="center">rinn7e.com</h1>

<p align="center">
  The landing page of my open source products. For now it serves a placeholder page.
</p>

<p align="center">
  <a href="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml"><img src="https://github.com/rinn7e/rinn7e.github.io/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rinn7e/rinn7e.github.io" alt="License: GPL-3.0"></a>
</p>

The casual personal website that used to live here moved to [`rinn7e/me`](https://github.com/rinn7e/me), served at [me.rinn7e.com](https://me.rinn7e.com/). It keeps the full history of the old site; this repository starts fresh.

## Layout

```
site/index.html    the placeholder page, plain HTML and CSS
site/favicon.svg   the R7 logo, with favicon-32.png and apple-touch-icon.png
```

## Deploy

GitHub Pages serves `site/` at [rinn7e.com](https://rinn7e.com/). `.github/workflows/deploy.yml` deploys every push to `master`. The custom domain is set in the Pages settings of the repository, with "GitHub Actions" as the source.

## License

The code is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
