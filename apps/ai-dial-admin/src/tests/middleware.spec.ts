import { NextRequestWithAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CspHeader } from '@/src/utils/security/models';

const NONCE_PATTERN = /'nonce-([^']+)'/;

const runMiddleware = async (path: string): Promise<Response> => {
  const { default: middleware } = await import('@/src/middleware');
  const request = new NextRequest(`http://localhost${path}`) as NextRequestWithAuth;
  const response = await middleware(request, {} as NextFetchEvent);

  if (!response) {
    throw new Error('The middleware returned no response');
  }

  return response;
};

describe('middleware', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', '');
    vi.stubEnv('CSP_MODE', '');
  });

  test('sends a report-only policy with a page when the mode is not set', async () => {
    const response = await runMiddleware('/en/home');

    expect(response.headers.get(CspHeader.ReportOnly)).toContain("default-src 'self'");
    expect(response.headers.get(CspHeader.Enforce)).toBeNull();
  });

  test('sends an enforcing policy with a page when the mode is enforce', async () => {
    vi.stubEnv('CSP_MODE', 'enforce');

    const response = await runMiddleware('/en/home');

    expect(response.headers.get(CspHeader.Enforce)).toContain("default-src 'self'");
    expect(response.headers.get(CspHeader.ReportOnly)).toBeNull();
  });

  test.each([
    ['', CspHeader.ReportOnly],
    ['enforce', CspHeader.Enforce],
  ])('passes the same policy to the renderer on the request headers when the mode is "%s"', async (mode, header) => {
    vi.stubEnv('CSP_MODE', mode);

    const response = await runMiddleware('/en/home');
    const policy = response.headers.get(header);

    expect(policy).toMatch(NONCE_PATTERN);
    expect(response.headers.get(`x-middleware-request-${header.toLowerCase()}`)).toBe(policy);
  });

  test('generates a new nonce for every response', async () => {
    const first = await runMiddleware('/en/home');
    const second = await runMiddleware('/en/home');

    expect(first.headers.get(CspHeader.ReportOnly)).not.toBe(second.headers.get(CspHeader.ReportOnly));
  });

  test('keeps the locale header and cookie of the i18n middleware', async () => {
    const response = await runMiddleware('/en/home');

    expect(response.headers.get('X-Next-Locale')).toBe('en');
    expect(response.headers.get('set-cookie')).toContain('Next-Locale=en');
  });

  test('returns the i18n redirect without a policy for a path without a locale', async () => {
    const response = await runMiddleware('/home');

    expect(response.headers.get('location')).toBe('http://localhost/en/home');
    expect(response.headers.get(CspHeader.ReportOnly)).toBeNull();
    expect(response.headers.get(CspHeader.Enforce)).toBeNull();
  });
});
