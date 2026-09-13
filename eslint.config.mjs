// `eslint-config-next` (as of the version pinned in package.json) exports
// ready-made ESLint flat-config arrays directly — no `FlatCompat` bridge
// needed. Routing them through `FlatCompat.extends('next/core-web-vitals', ...)`
// (the old pattern for pre-flat-config `eslint-config-next` releases) feeds
// an already-flat config back into the legacy eslintrc schema validator,
// which errors while trying to format that structure (its `plugins`
// objects self-reference, e.g. `configs.recommended.plugins.react`, so
// `JSON.stringify` on the error message throws "Converting circular
// structure to JSON" and ESLint crashes before it can lint anything).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: ['.next/', 'src/payload-types.ts', 'src/payload-generated-schema.ts'],
  },
]

export default eslintConfig
