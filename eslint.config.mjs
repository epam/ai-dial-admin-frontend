import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nx from '@nx/eslint-plugin';
import globals from 'globals';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import prettierPlugin from 'eslint-plugin-prettier';

const { FocusEvent, MouseEvent, Notification, ...browserGlobals } = globals.browser;

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
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',
      parserOptions: {
        project: ['tsconfig.*?.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@nx': nx,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/exhaustive-deps': 'error',
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

      'no-multiple-empty-lines': [
        'warn',
        {
          max: 1,
          maxBOF: 0,
        },
      ],
    },
  },
];
