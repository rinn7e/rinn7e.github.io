import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import unusedImports from 'eslint-plugin-unused-imports'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  globalIgnores(['dist', 'dist-ssr']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },

    rules: {
      'no-else-return': 'off',
      'no-lonely-if': 'off',
      'no-control-regex': 'off',
      'import/no-cycle': [2, { ignoreExternal: true }],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // No casts: an owned value is made only by its owner, the one file
      // that casts to it (doc/code-convention.md, "Owned values")
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      // Import fp-ts and io-ts modules by name ('fp-ts/TaskEither'), so the
      // bundler picks their tree-shakeable ES module build
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'fp-ts/lib/*',
                'fp-ts/es6/*',
                'io-ts/lib/*',
                'io-ts/es6/*',
              ],
              message: "Import from 'fp-ts/<Module>' instead.",
            },
          ],
        },
      ],
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'react-x/no-use-context': 'off',
      'react-x/no-forward-ref': 'off',
      'react-x/no-array-index-key': 'off',

      'react-dom/no-dangerously-set-innerhtml': 'off',

      // The URL is a thin wrapper around the destination: only the URL
      // adapter (`src/common/util/browser-history.ts`) touches the history
      // of the browser (doc/code-convention.md, "Navigation and the URL")
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'history',
          message:
            'Only src/common/util/browser-history.ts touches the history: the URL is written from the destination by urlWriterOf (doc/code-convention.md, "Navigation and the URL").',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'history',
          message:
            'Only src/common/util/browser-history.ts touches the history: the URL is written from the destination by urlWriterOf (doc/code-convention.md, "Navigation and the URL").',
        },
      ],
    },
  },
  {
    // The URL adapter: the one file that reads and writes the history
    files: ['src/common/util/browser-history.ts'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-globals': 'off',
    },
  },
  {
    // The renderer of the pages and the share cards run in Node at build
    // time (`tool/prerender.mjs`), never under Fast Refresh, so they export
    // functions next to their views, as on TEA Ecosystem
    files: ['src/prerender.tsx', 'src/share-card.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
