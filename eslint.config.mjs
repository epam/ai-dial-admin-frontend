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

    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...tailwindPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': 'off',
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
    },
  },
  prettierConfig,
];
