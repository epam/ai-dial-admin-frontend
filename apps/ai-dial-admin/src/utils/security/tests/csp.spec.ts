import { describe, expect, test } from 'vitest';

import { buildContentSecurityPolicy, resolveCspMode } from '@/src/utils/security/csp';
import { CspDirective, CspHeader, CspMode, CspPolicyInput } from '@/src/utils/security/models';

const NONCE = 'test-nonce';

const buildPolicy = (input?: Partial<CspPolicyInput>) =>
  buildContentSecurityPolicy({ nonce: NONCE, mode: CspMode.ReportOnly, isDevelopment: false, ...input });

const getDirectives = (value: string): Map<string, string> =>
  new Map(
    value.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ');

      return [name, sources.join(' ')];
    }),
  );

describe('resolveCspMode', () => {
  test('returns report-only when the value is not set', () => {
    expect(resolveCspMode()).toBe(CspMode.ReportOnly);
    expect(resolveCspMode('')).toBe(CspMode.ReportOnly);
  });

  test('returns enforce for the enforce value', () => {
    expect(resolveCspMode('enforce')).toBe(CspMode.Enforce);
  });

  test('ignores case and surrounding whitespace', () => {
    expect(resolveCspMode(' Enforce ')).toBe(CspMode.Enforce);
    expect(resolveCspMode('ENFORCE')).toBe(CspMode.Enforce);
  });

  test.each(['off', 'true', 'report-only', 'enforced'])('returns report-only for the unknown value %s', (value) => {
    expect(resolveCspMode(value)).toBe(CspMode.ReportOnly);
  });
});

describe('buildContentSecurityPolicy', () => {
  test('names the header by the mode', () => {
    expect(buildPolicy({ mode: CspMode.ReportOnly }).headerName).toBe(CspHeader.ReportOnly);
    expect(buildPolicy({ mode: CspMode.Enforce }).headerName).toBe(CspHeader.Enforce);
  });

  test('builds the same directives in both modes', () => {
    expect(buildPolicy({ mode: CspMode.Enforce }).value).toBe(buildPolicy({ mode: CspMode.ReportOnly }).value);
  });

  test('states every directive exactly once', () => {
    const names = buildPolicy()
      .value.split('; ')
      .map((directive) => directive.split(' ')[0]);

    expect(names).toEqual(Object.values(CspDirective));
  });

  test('authorises scripts by the nonce without unsafe sources in production', () => {
    const directives = getDirectives(buildPolicy().value);

    expect(directives.get(CspDirective.ScriptSrc)).toBe(`'self' 'nonce-${NONCE}' 'strict-dynamic'`);
  });

  test('adds unsafe-eval to scripts in development only', () => {
    const directives = getDirectives(buildPolicy({ isDevelopment: true }).value);

    expect(directives.get(CspDirective.ScriptSrc)).toBe(`'self' 'nonce-${NONCE}' 'strict-dynamic' 'unsafe-eval'`);
  });

  test('uses the given nonce', () => {
    const directives = getDirectives(buildPolicy({ nonce: 'another' }).value);

    expect(directives.get(CspDirective.ScriptSrc)).toContain("'nonce-another'");
  });

  test('fixes the frame, image and connection sources', () => {
    const directives = getDirectives(buildPolicy().value);

    expect(directives.get(CspDirective.FrameSrc)).toBe("'self' https:");
    expect(directives.get(CspDirective.ImgSrc)).toBe("'self' data: blob:");
    expect(directives.get(CspDirective.ConnectSrc)).toBe("'self'");
  });

  test('forbids plugins, foreign base URLs and embedding', () => {
    const directives = getDirectives(buildPolicy().value);

    expect(directives.get(CspDirective.ObjectSrc)).toBe("'none'");
    expect(directives.get(CspDirective.BaseUri)).toBe("'self'");
    expect(directives.get(CspDirective.FrameAncestors)).toBe("'none'");
  });
});
