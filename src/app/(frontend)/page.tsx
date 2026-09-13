import PageTemplate, { generateMetadata } from './[slug]/page'

// The home page renders through the same Payload-backed `[slug]` template
// (queried for slug "home"). Unlike `/[slug]/*`, this route has no
// `generateStaticParams` of its own, so Next.js would otherwise always try
// to statically prerender it at build time — which requires a live
// Postgres connection. Rendering it dynamically instead means the build
// never depends on the database being reachable, and the page is always
// served fresh from Payload's Local API at request time.
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
