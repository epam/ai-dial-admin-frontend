import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/ai-dial-admin',
  plugins: [
    react(),
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
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**.config.ts'],
    reporters: ['default'],
    setupFiles: './test-setup.tsx',
    coverage: {
      reporter: ['text', 'html', 'clover', 'json'],
      reportsDirectory: '../../coverage/apps/ai-dial-admin',
      provider: 'v8' as const,
      thresholds: {
        branches: 38,
        functions: 40,
        lines: 48,
        statements: 48,
      },
    },
  },
}));
