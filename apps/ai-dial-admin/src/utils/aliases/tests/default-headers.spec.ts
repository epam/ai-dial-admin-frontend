import { describe, expect, test } from 'vitest';

import { AliasPresentAs } from '@/src/models/dial/alias';
import { applyAliasTargetChange, canAliasHaveDefaultHeaders, getAliasEffectivePresentAs } from '../default-headers';

describe('getAliasEffectivePresentAs', () => {
  test('is the stored presentation when one is set', () => {
    expect(
      getAliasEffectivePresentAs({ target: { path: 'applications/public/x' }, presentAs: AliasPresentAs.Toolset }),
    ).toBe(AliasPresentAs.Toolset);
  });

  test.each([
    ['models/gpt', AliasPresentAs.Model],
    ['toolsets/public/x', AliasPresentAs.Toolset],
    ['routers/r', AliasPresentAs.Router],
  ])('falls back to the default of a %s target', (path, expected) => {
    expect(getAliasEffectivePresentAs({ target: { path } })).toBe(expected);
  });

  test.each([undefined, 'aliases/public/other'])('is unknown for the target "%s"', (path) => {
    expect(getAliasEffectivePresentAs({ target: path ? { path } : undefined })).toBeUndefined();
  });
});

describe('canAliasHaveDefaultHeaders', () => {
  test.each([
    [{ target: { path: 'models/gpt' } }, true],
    [{ target: { path: 'routers/r' }, presentAs: AliasPresentAs.Model }, true],
    [{ target: { path: 'applications/public/x' } }, true],
    [{}, true],
    [{ target: { path: 'toolsets/public/x' } }, false],
    [{ target: { path: 'applications/public/x' }, presentAs: AliasPresentAs.Toolset }, false],
  ])('answers for %o', (alias, expected) => {
    expect(canAliasHaveDefaultHeaders(alias)).toBe(expected);
  });
});

describe('applyAliasTargetChange', () => {
  const alias = {
    displayName: 'Assistant',
    target: { path: 'applications/public/x' },
    defaultHeaders: { 'X-Team': 'a' },
  };

  test('keeps the headers when the new type sends them', () => {
    expect(applyAliasTargetChange(alias, { target: { path: 'models/gpt' }, presentAs: undefined })).toEqual({
      ...alias,
      target: { path: 'models/gpt' },
      presentAs: undefined,
    });
  });

  test('drops the headers when the alias becomes a toolset', () => {
    expect(
      applyAliasTargetChange(alias, { target: { path: 'applications/public/x' }, presentAs: AliasPresentAs.Toolset }),
    ).toEqual({
      ...alias,
      presentAs: AliasPresentAs.Toolset,
      defaultHeaders: undefined,
    });
  });

  test('keeps the headers while the target is cleared', () => {
    expect(applyAliasTargetChange(alias, { target: undefined, presentAs: undefined }).defaultHeaders).toEqual({
      'X-Team': 'a',
    });
  });
});
