import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules',
      '**/next',
      '**/.next',
      '**/next-env.d.ts',
      '**/**.config.js',
      '**/**.config.mjs',
      '**/jest.config.ts',
      '**/**.spec.ts',
      '**/**.spec.tsx',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: ['tsconfig.*?.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
      },
    },

    plugins: {
      '@nx': nx,
      react: reactPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      import: importPlugin,
      tailwindcss: tailwindPlugin,
    },

    settings: {
      tailwindcss: {
        config: 'apps/ai-dial-admin/tailwind.config.js',
        callees: ['classnames', 'clsx', 'cn'],
      },
    },

    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'error',
      'import/named': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: [],

          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-empty': 'error',

      'no-constant-condition': 'error',

      'no-multiple-empty-lines': [
        'warn',
        {
          max: 1,
          maxBOF: 0,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^__',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',

      // Accessibility. The plugin was registered here long before any of its
      // rules were switched on; this turns the recommended set on. See
      // `.claude/rules/a11y.md` for the patterns lint cannot check.
      //
      // 25 of the 34 recommended rules are already clean and stay at the
      // recommended severity. The overrides below are the ones with existing
      // violations — kept at `warn` so they surface on touched code without
      // blocking unrelated work. Ratchet each to `error` once its count is 0.
      ...jsxA11yPlugin.configs.recommended.rules,

      // Interactive semantics on non-interactive elements (37 + 29 + 7 + 4).
      // Nearly all are `<div onClick>` that should be a `<button>`.
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      // 11 violations, and the rule is opinionated about what counts as a label.
      'jsx-a11y/control-has-associated-label': 'warn',
      // 3 violations, all invented roles (`role="activities"`, `role="icon"`,
      // `role="dashboards"`) used as test selectors — a `data-testid` in
      // disguise, which `testing.md` forbids. Fixing needs the component AND
      // its spec changed together, so it is not a lint-config concern.
      'jsx-a11y/aria-role': 'warn',
      // 2 violations, both in App Router layouts that render their own <html>.
      'jsx-a11y/html-has-lang': 'warn',
      // Deprecated upstream in favour of label-has-associated-control, which is
      // enabled above and already clean.
      'jsx-a11y/label-has-for': 'off',
    },
  },
  prettierConfig,
];
