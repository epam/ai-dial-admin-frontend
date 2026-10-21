import { createRequire } from 'node:module';

import { describe, expect, test } from 'vitest';

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const require = createRequire(import.meta.url);

const loadRedirects = async (): Promise<Redirect[]> => {
  const config = require('../../../next.config.js') as { redirects: () => Promise<Redirect[]> };
  return config.redirects();
};

const LEGACY_SEGMENTS = ['adapter-containers', 'application-containers', 'interceptor-containers', 'mcp-containers'];

describe('container redirects', () => {
  test.each(LEGACY_SEGMENTS)('%s list and detail paths redirect permanently to /containers', async (segment) => {
    const redirects = await loadRedirects();

    expect(redirects).toContainEqual({ source: `/:prefix/${segment}`, destination: '/containers', permanent: true });
    expect(redirects).toContainEqual({
      source: `/:prefix/${segment}/:path*`,
      destination: '/containers/:path*',
      permanent: true,
    });
  });

  test.each(['mcp-deployments', 'interceptor-deployments'])('%s go straight to /containers', async (segment) => {
    const redirects = await loadRedirects();

    expect(redirects).toContainEqual({ source: `/:prefix/${segment}`, destination: '/containers', permanent: true });
    expect(redirects).toContainEqual({
      source: `/:prefix/${segment}/:path`,
      destination: '/containers/:path',
      permanent: true,
    });
  });

  test('no redirect still targets a legacy container path', async () => {
    const redirects = await loadRedirects();

    redirects.forEach(({ destination }) => {
      expect(LEGACY_SEGMENTS.some((segment) => destination.startsWith(`/${segment}`))).toBe(false);
    });
  });
});
