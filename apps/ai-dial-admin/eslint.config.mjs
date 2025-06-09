import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['.next/**/*', '**/**.config.js', '**/**.config.mjs', '**/jest.config.ts', '**/setup-jest.js'],
  },
  ...baseConfig,
];
