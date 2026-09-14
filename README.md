# RailBlog

A one-service blog and content-site template for [Railway](https://railway.com):
**Next.js 15 with Payload CMS 3 embedded in the same app** — no separate CMS
backend, no separate frontend deploy — backed by a single Postgres plugin.

Railway's Blogs category is dominated by Ghost (roughly 3,600 deploys across
nine near-identical listings) because it's a real one-click admin panel and
nothing else there competes on that ground. The only "modern stack" entries
(Next.js + headless WordPress, Next.js + Strapi) need two or three separate
services to run — which makes them *more* complex to deploy than Ghost, not
less. RailBlog is the first entry in that gap that's actually lighter: one
app, one database, one deploy. See [`docs/sdd.html`](docs/sdd.html) for the
full system design document.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| CMS | [Payload CMS 3](https://payloadcms.com) — runs as a Next.js plugin, not a separate service |
| Database | Postgres via `@payloadcms/db-postgres` |
| Rich text | Lexical (Payload's default editor) |
| Media storage | Local disk under `public/media`, persisted via a Railway Volume |
| SEO | `@payloadcms/plugin-seo` — per-post meta title/description/image |

## Why one service

Payload CMS 3 mounts into a Next.js app's own route tree instead of running
as an independent server. That means the admin panel (`/admin`), the
content API (REST/GraphQL/Local API), and the public-facing blog all run in
the same Next.js process — there's no network hop between "the CMS" and
"the site" because they're the same app. In practice that means:

- **One Railway service, one Postgres plugin.** No second app to deploy, no
  API URL to configure and keep in sync.
- **Content queries use the Local API** (`payload.find(...)`), an in-process
  function call — not an HTTP round trip to itself.
- A Railway **Volume** is the one piece of infrastructure this needs beyond
  the database, so uploaded media survives a redeploy instead of living in
  the container's ephemeral writable layer.

## Project structure

```
src/
  app/(frontend)/   Public blog: post list, post pages, categories, search, RSS, sitemaps
  app/(payload)/    Payload's admin panel (/admin) and REST/GraphQL API, mounted into Next.js
  collections/      posts, categories, media, users, pages — Payload collection configs
  payload.config.ts Collections, plugins, and hooks, running in-process with Next.js
docs/
  sdd.html          System design document
tests/unit/         Vitest unit tests — no live database required
Dockerfile          Multi-stage build on node:20-bookworm-slim (glibc, for Payload's sharp dependency)
.railway/railway.ts Railway Infrastructure-as-Code: Postgres, a media Volume, and the web service
```

### Collections

| Collection | Purpose |
| --- | --- |
| `posts` | title, slug, `excerpt`, Lexical rich-text `content`, `heroImage` (featured image), `categories`, `publishedAt`, draft/publish workflow (Payload versions), SEO fields |
| `categories` | title, slug |
| `media` | Upload collection, local disk storage under `public/media` |
| `users` | Payload's built-in auth collection, used to log into `/admin` |
| `pages` | Flexible page builder kept from the base template — useful for an About/Contact page alongside the blog |

Publishing a post triggers an `afterChange` hook that calls Next's
`revalidatePath` for that post's URL and the `/posts` index, so a publish is
live within seconds without a full rebuild — see
`src/collections/Posts/hooks/revalidatePost.ts`.

### Frontend feeds

- `/posts-sitemap.xml` and `/pages-sitemap.xml` — generated through Payload's
  Local API, listing only published content. `/robots.txt` links to both.
- `/rss.xml` — RSS 2.0 feed of published posts (title, link, pubDate,
  description), also via the Local API.

## Local development

Requires Node 20+ and a local Postgres (or point `DATABASE_URL` at a hosted
one).

```bash
npm install
cp .env.example .env
# edit .env — point DATABASE_URL at a Postgres instance,
# or run `docker-compose up -d` to start one locally on 127.0.0.1:5432.

npm run dev
```

Open `http://localhost:3000/admin` and follow the on-screen prompts to
create your first admin user, then visit `http://localhost:3000` for the
blog.

Useful scripts:

- `npm run generate:types` — regenerate `src/payload-types.ts` after
  changing any collection.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run test:unit` — Vitest unit tests, no database required.
- `npm run build` / `npm run start` — production build and start (what the
  Dockerfile runs).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `PAYLOAD_SECRET` | Yes | Signs admin session data and encrypts JWTs — generate a long random string |
| `NEXT_PUBLIC_SERVER_URL` | Yes | Public origin used in SEO metadata, sitemap, and RSS links (no trailing slash) |
| `CRON_SECRET` | Optional | Authorizes Payload's scheduled-publish job endpoint when there's no logged-in user |
| `PREVIEW_SECRET` | Optional | Validates live-preview / draft-preview requests |

On Railway, `DATABASE_URL` is injected automatically as a
[reference variable](https://docs.railway.com/guides/variables#reference-variables)
from the Postgres plugin — see `.railway/railway.ts`.

## Testing

```bash
npm run test:unit
```

16 unit tests cover slug generation/validation, the RSS feed's XML shape,
and the sitemap's XML shape — all without touching a live database.
`npm run test:int` (integration) and `npm run test:e2e` (Playwright) need a
live Postgres and are unchanged from the base template.

## Deploying

`.railway/railway.ts` declares the full stack as code: a managed Postgres
database, a Volume named `media` (500MB) mounted at
`/app/public/media` in the web service, and the web service itself built
from this repo's Dockerfile. **The Volume is required for uploads to
persist** — without it, anything uploaded through `/admin` is lost on every
redeploy. Update the `github(...)` source in `.railway/railway.ts` to point
at your own `owner/repo` before applying it.

The Dockerfile builds on `node:20-bookworm-slim` rather than Alpine, because
Payload's `sharp` image-processing dependency needs glibc-compatible native
bindings.

### Running the first migration

The production image only ships the Next.js standalone runtime — no
`src/migrations` source and no Payload CLI — so migrations aren't run
automatically inside the container. After the first deploy, run them once
against the live database from your machine:

```bash
railway tcp-proxy create --port 5432 --service Postgres   # temporary public endpoint
DATABASE_URL="postgresql://postgres:<password>@<proxy-host>:<proxy-port>/railway" \
  PAYLOAD_SECRET=temp NEXT_PUBLIC_SERVER_URL=https://your-app.up.railway.app \
  npm run payload -- migrate
railway tcp-proxy delete <proxy-id> --yes                 # close it back up
```

The connection details for the proxy come from `railway tcp-proxy create`'s
output; `PAYLOAD_SECRET`/`NEXT_PUBLIC_SERVER_URL` can be any placeholder for
this one-off run — only `DATABASE_URL` needs to be real. `src/migrations/`
already contains the initial schema migration generated from this
template's collections; you only need to re-run `payload migrate:create`
if you add or change a collection afterward.

## Notes on the base template

This project was scaffolded from Payload's official `create-payload-app`
website template (`npx create-payload-app@latest --template website --db
postgres`) and adjusted for this use case: added the `excerpt` field, added
`/rss.xml`, switched the Docker base image, added the Railway IaC file, and
wired the Postgres-backed local dev flow.

## License

See [`LICENSE`](LICENSE) if present, or the base Payload template's license
terms.

