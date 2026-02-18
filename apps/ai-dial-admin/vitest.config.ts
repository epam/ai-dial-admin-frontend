import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config';

import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/ai-dial-admin',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    {
      name: 'load-svg',
      enforce: 'pre',
      transform(_, id) {
        if (id.endsWith('.svg')) {
          return 'export default () => {}';
        }
      },
    },
  ],
  test: {
    globals: true,
    // environment: 'node',
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...configDefaults.exclude, '**/.next/**', '*.config.{ts,js}'],
    reporters: ['default'],
    setupFiles: './test-setup.tsx',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'clover', 'json'],
      reportsDirectory: '../../coverage/apps/ai-dial-admin',
      provider: 'v8' as const,
      thresholds: {
        branches: 70,
        functions: 60,
        lines: 50,
        statements: 50,
      },
      exclude: [...coverageConfigDefaults.exclude, '*.config.{ts,js}', 'test-setup.tsx'],
    },
  },
}));
