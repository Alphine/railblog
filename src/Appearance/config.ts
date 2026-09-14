import type { GlobalConfig } from 'payload'

import { revalidateAppearance } from './hooks/revalidateAppearance'

export const Appearance: GlobalConfig = {
  slug: 'appearance',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
  },
  fields: [
    {
      name: 'theme',
      type: 'select',
      required: true,
      defaultValue: 'default',
      admin: {
        description:
          'Sets the site-wide visual theme. Changes apply immediately, no redeploy needed.',
      },
      options: [
        { label: 'Default (indigo)', value: 'default' },
        { label: 'Techno', value: 'techno' },
        { label: 'Natural', value: 'natural' },
        { label: 'Casual', value: 'casual' },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateAppearance],
  },
}
