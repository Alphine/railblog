/**
 * Wraps a route's `generateStaticParams` body so that a database failure at
 * build time (no live Postgres reachable — e.g. a CI/Docker image build
 * that runs before the database is provisioned) degrades gracefully to "no
 * pre-rendered params" instead of failing the entire `next build`.
 *
 * Next.js treats params that `generateStaticParams` doesn't return as
 * dynamic by default (`dynamicParams` defaults to `true`), so when this
 * happens the affected routes are simply rendered on demand against a real
 * database at request time, instead of being pre-rendered at build time.
 * Once a real database is reachable, `generate` succeeds normally and pages
 * are pre-rendered as usual.
 */
export async function safeGenerateStaticParams<T>(
  routeLabel: string,
  generate: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await generate()
  } catch (error) {
    console.warn(
      `[generateStaticParams] Skipping static params for "${routeLabel}" — could not query the database at build time. These routes will render on demand instead. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return []
  }
}
