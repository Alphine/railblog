import { defineRailway, github, postgres, service, volume } from 'railway/iac'

// RailBlog — one Postgres database, one persistent Volume for uploaded
// media, and one Dockerfile-built web service (Next.js + embedded Payload).
//
// IMPORTANT: replace the `github(...)` repo slug below with your actual
// "<owner>/<repo>" once this project is pushed to GitHub — it is a
// placeholder here since this scaffold has no git remote yet.
export default defineRailway((ctx) => {
  const db = postgres('Postgres')

  // Must stay in sync with the Media collection's upload.staticDir
  // (src/collections/Media.ts -> <project root>/public/media), which is
  // what the Next.js standalone Docker image resolves to at
  // /app/public/media (see Dockerfile).
  const media = volume('media', { sizeMB: 500 })

  const web = service('web', {
    source: github('Alphine/RailBlog', { branch: 'main' }),
    build: { builder: 'DOCKERFILE' },
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      PAYLOAD_SECRET: { value: ctx.randomString('payload-secret', 32) },
      NEXT_PUBLIC_SERVER_URL: 'https://${{RAILWAY_PUBLIC_DOMAIN}}',
    },
    volumeMounts: {
      media: { mountPath: '/app/public/media' },
    },
  })

  return { name: 'RailBlog', resources: [db, media, web] }
})
