import { describe, expect, test } from 'vitest';

import { AliasTargetType } from '@/src/models/dial/alias';
import { AssetSource } from '@/src/models/dial/asset-source';
import { parseAliasTargetPath, toAliasTargetPath } from '../target';

describe('toAliasTargetPath', () => {
  test('keeps the bucket and path of a Public pick', () => {
    expect(
      toAliasTargetPath(AliasTargetType.Application, {
        source: AssetSource.Public,
        name: 'public/team/assistant',
        path: 'public/team/assistant',
      }),
    ).toBe('applications/public/team/assistant');
    expect(
      toAliasTargetPath(AliasTargetType.Toolset, {
        source: AssetSource.Public,
        name: 'public/search',
        path: 'public/search',
      }),
    ).toBe('toolsets/public/search');
  });

  test('percent-encodes each segment of a Public path, keeping the separators', () => {
    expect(
      toAliasTargetPath(AliasTargetType.Application, {
        source: AssetSource.Public,
        name: 'app__1.0.0',
        path: 'public/QA/Code Apps ALS/app__1.0.0',
      }),
    ).toBe('applications/public/QA/Code%20Apps%20ALS/app__1.0.0');
    expect(
      toAliasTargetPath(AliasTargetType.Toolset, { source: AssetSource.Public, name: 'x', path: 'public/a&b/c#d%e' }),
    ).toBe('toolsets/public/a%26b/c%23d%25e');
  });

  test.each([AssetSource.Platform, AssetSource.ConfigFile])('stores a %s pick by its bare name', (source) => {
    expect(toAliasTargetPath(AliasTargetType.Model, { source, name: 'gpt-4-internal' })).toBe('models/gpt-4-internal');
  });

  test('stores the same name picked on either flat tab as one target', () => {
    expect(toAliasTargetPath(AliasTargetType.Application, { source: AssetSource.Platform, name: 'assistant' })).toBe(
      toAliasTargetPath(AliasTargetType.Application, { source: AssetSource.ConfigFile, name: 'assistant' }),
    );
  });

  test('falls back to the name for a Public pick that reports no path', () => {
    expect(toAliasTargetPath(AliasTargetType.Application, { source: AssetSource.Public, name: 'x' })).toBe(
      'applications/x',
    );
  });
});

describe('parseAliasTargetPath', () => {
  test.each([
    ['models/gpt-4', AliasTargetType.Model, 'gpt-4'],
    ['applications/public/team/assistant', AliasTargetType.Application, 'public/team/assistant'],
    ['toolsets/public/search', AliasTargetType.Toolset, 'public/search'],
    ['applications/platform/assistant', AliasTargetType.Application, 'platform/assistant'],
    ['routers/smart-router', AliasTargetType.Router, 'smart-router'],
  ])('reads %s', (path, type, reference) => {
    expect(parseAliasTargetPath(path)).toEqual({ type, reference });
  });

  test.each([undefined, '', 'models', 'models/', '/gpt', 'prompts/public/x', 'aliases/public/other'])(
    'cannot represent "%s"',
    (path) => {
      expect(parseAliasTargetPath(path)).toBeNull();
    },
  );

  test('decodes an encoded reference', () => {
    expect(parseAliasTargetPath('applications/public/QA/Code%20Apps%20ALS/app__1.0.0')).toEqual({
      type: AliasTargetType.Application,
      reference: 'public/QA/Code Apps ALS/app__1.0.0',
    });
  });

  test('cannot represent a malformed escape', () => {
    expect(parseAliasTargetPath('applications/public/100%/app')).toBeNull();
  });

  test('round-trips a Public path with spaces', () => {
    const path = toAliasTargetPath(AliasTargetType.Application, {
      source: AssetSource.Public,
      name: 'app',
      path: 'public/QA/Code Apps ALS/app',
    });

    expect(parseAliasTargetPath(path)).toEqual({
      type: AliasTargetType.Application,
      reference: 'public/QA/Code Apps ALS/app',
    });
  });

  test('round-trips what it writes', () => {
    const path = toAliasTargetPath(AliasTargetType.Model, { source: AssetSource.Platform, name: 'gpt' });

    expect(parseAliasTargetPath(path)).toEqual({ type: AliasTargetType.Model, reference: 'gpt' });
  });
});
