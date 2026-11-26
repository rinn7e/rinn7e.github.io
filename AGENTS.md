# Notes for AI coding agents

- Start with [README.md](README.md), then follow [doc/code-convention.md](doc/code-convention.md) for code.
- This repository is public and holds only the website at `rinn7e.com`. Never put a phone number, address or private email into any tracked file, and never name a client, an employer project or a private project.
- The products shown are public repositories of `github.com/rinn7e` only, and no libraries.
- A new blog post is done only when it is also published on dev.to and the two are linked both ways (the canonical URL of the copy points here, `devToUrl` here points to the copy): follow "Publish a new post" in [doc/blog.md](doc/blog.md). Publishing on dev.to posts under the name of the owner, so ask before that step.
- The casual personal website lives in a separate repository, `rinn7e/me` (`me.rinn7e.com`). Do not bring its code back here.
- Before adding a request to another host, an asset from a CDN, an embed, an analytics tool, or anything kept in the browser (cookies, storage), read "The privacy page" in [doc/code-convention.md](doc/code-convention.md): the Privacy page (`src/screen/privacy-screen/component.tsx`) must change in the same commit.
- Before calling a change done, run `pnpm run check`, `pnpm run lint`, `pnpm run format:check` and `pnpm test`, and look at the page at desktop and phone width (375 px: no horizontal scroll).
