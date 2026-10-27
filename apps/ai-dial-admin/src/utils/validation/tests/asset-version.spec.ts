import { describe, expect, test } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { ResourceType } from '@/src/types/resource-type';
import { ErrorType } from '@/src/types/error-type';
import {
  getAssetDestinationError,
  getAssetPathsFromVersions,
  getAssetVersionError,
} from '@/src/utils/validation/asset-version';

const t = (key: string) => key;

describe('asset version validation', () => {
  test.each(['stable', 'release candidate', '2026-10', '春の版', 'release_candidate', 'a%?#:b'])(
    'accepts text %s without semver validation',
    (version) => {
      expect(getAssetVersionError(version, t)).toBeNull();
    },
  );

  test.each([undefined, '', '   '])('rejects blank %s', (version) => {
    expect(getAssetVersionError(version, t)?.type).toBe(ErrorType.EMPTY);
  });

  test.each(['release__candidate', '_preview', '__preview'])('rejects ambiguous delimiter %s', (version) => {
    expect(getAssetVersionError(version, t)).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: ErrorI18nKey.AmbiguousAssetVersion,
    });
  });

  test.each(['a/b', 'a{b', 'a}b', 'a"b', 'a\nb', 'a\u0000b', 'preview.'])('rejects path-invalid %s', (version) => {
    expect(getAssetVersionError(version, t)?.type).toBe(ErrorType.INVALID);
  });

  test('checks the complete destination, not name alone', () => {
    const paths = ['public/team/app__stable'];
    expect(getAssetDestinationError('public/team/', 'app', 'preview', ResourceType.APPLICATION, t, paths)).toBeNull();
    expect(getAssetDestinationError('public/team/', 'app', 'stable', ResourceType.APPLICATION, t, paths)?.type).toBe(
      ErrorType.EXISTING,
    );
    expect(getAssetDestinationError('public/other/', 'app', 'stable', ResourceType.APPLICATION, t, paths)).toBeNull();
  });

  test('rejects invalid parent path segments', () => {
    expect(getAssetDestinationError('public/folder./', 'app', 'stable', ResourceType.APPLICATION, t)?.type).toBe(
      ErrorType.INVALID,
    );
    expect(getAssetDestinationError('public//folder/', 'app', 'stable', ResourceType.APPLICATION, t)?.type).toBe(
      ErrorType.INVALID,
    );
  });

  test.each([ResourceType.APPLICATION, ResourceType.TOOLSET])('checks total UTF-8 bytes for %s', (resourceType) => {
    const prefix = resourceType === ResourceType.APPLICATION ? 'applications/public/app__' : 'toolsets/public/app__';
    const limitVersion = 'a'.repeat(900 - prefix.length);
    expect(getAssetDestinationError('public/', 'app', limitVersion, resourceType, t)).toBeNull();
    expect(getAssetDestinationError('public/', 'app', `${limitVersion}a`, resourceType, t)?.type).toBe(
      ErrorType.LENGTH,
    );
    expect(getAssetDestinationError('public/', 'app', '春'.repeat(300), resourceType, t)?.type).toBe(ErrorType.LENGTH);
  });

  test('converts a destination folder version map into exact paths', () => {
    expect(
      getAssetPathsFromVersions('public/team', { app: ['stable', 'preview'], app__internal: ['candidate'] }),
    ).toEqual(['public/team/app__stable', 'public/team/app__preview', 'public/team/app__internal__candidate']);
    expect(getAssetPathsFromVersions('public/')).toEqual([]);
  });
});
