import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

export const revalidateAppearance: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating appearance')

    // The theme is read server-side in the root layout, which every route
    // shares — invalidate the whole tree instead of a single path.
    revalidatePath('/', 'layout')
  }

  return doc
}
