# Deploy and Host RailBlog on Railway

RailBlog is a one-service blog and content-site template: Next.js 15
with Payload CMS 3 embedded in the same app — no separate CMS backend,
no separate frontend deploy — backed by a single Postgres plugin. Ghost
dominates Railway's Blogs category because it's a real one-click admin
panel; the only "modern stack" alternatives need two or three separate
services to run. RailBlog is the first entry that's actually lighter:
one app, one database, one deploy.

## About Hosting RailBlog

This template deploys a single Railway service running Next.js with
Payload CMS mounted into its own route tree — the admin panel at
`/admin`, the content API, and the public blog all render from the same
process, with content read through Payload's in-process Local API
rather than an HTTP round trip to itself. A Postgres plugin holds posts,
categories, media metadata, and admin users; a Railway Volume mounted
at `/app/public/media` persists uploaded images across redeploys.

## Why Deploy RailBlog on Railway?

Railway is a singular platform to deploy your infrastructure stack.
Railway will host your infrastructure so you don't have to deal with
configuration, while allowing you to vertically and horizontally scale
it. Deploying RailBlog on Railway means the app, the database, and
persistent media storage all live on one dashboard — no second service
to provision, no API URL to keep in sync between a frontend and a CMS
backend.

## Common Use Cases

- A blog or docs section for a product's marketing site, with a real
  admin UI instead of hand-edited MDX files in git.
- A companion blog for a SaaS you're already building — pairs naturally
  with a Next.js product (including Railhead, its sibling template).
- A lighter alternative to standing up Ghost or WordPress + MySQL when
  you'd rather own the whole stack in TypeScript.

## Dependencies for RailBlog Hosting

- None required to deploy — the template boots and lets you create your
  first admin user immediately at `/admin`.
- Optional: `CRON_SECRET` if you use Payload's scheduled-publish feature
  from outside a logged-in session, and `PREVIEW_SECRET` for live/draft
  preview links.

### Deployment Dependencies

- [Next.js](https://nextjs.org) 15 (App Router)
- [Payload CMS](https://payloadcms.com) 3 (embedded, not a separate
  service)
- Postgres via `@payloadcms/db-postgres`
- [Lexical](https://lexical.dev) rich text (Payload's default editor)

Full architecture and the system design document behind these decisions
live in the [GitHub repo](https://github.com/Alphine/railblog).
RailBlog is free and open source under
[LGPL-3.0](https://github.com/Alphine/railblog/blob/main/LICENSE) — fork
it and build a proprietary blog or product on top; only changes to
RailBlog itself need to stay open. Payload CMS and Next.js keep their
own (MIT) licenses as dependencies.
