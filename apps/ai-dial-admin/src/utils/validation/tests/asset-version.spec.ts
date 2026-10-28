import { describe, expect, test, vi } from 'vitest';

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

  describe.each([ResourceType.APPLICATION, ResourceType.TOOLSET])('getAssetDestinationError for %s', (resourceType) => {
    test('accepts a combined name and version of 255 characters including the delimiter', () => {
      expect(getAssetDestinationError('public/', 'a'.repeat(100), 'b'.repeat(153), resourceType, t)).toBeNull();
    });

    test.each([154, 160])('rejects a 100-character name with a %s-character version', (versionLength) => {
      expect(getAssetDestinationError('public/', 'a'.repeat(100), 'b'.repeat(versionLength), resourceType, t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.AssetNameVersionTooLong,
      });
    });

    test('passes the combined character limit to the localized message', () => {
      const translate = vi.fn(t);
      getAssetDestinationError('public/', 'a'.repeat(100), 'b'.repeat(154), resourceType, translate);
      expect(translate).toHaveBeenCalledWith(ErrorI18nKey.AssetNameVersionTooLong, { max: 255 });
    });

    test('accepts multibyte text within the character and storage byte limits', () => {
      expect(getAssetDestinationError('public/', '春'.repeat(100), '版'.repeat(153), resourceType, t)).toBeNull();
    });

    test('checks total UTF-8 bytes independently of the combined character limit', () => {
      const prefix = resourceType === ResourceType.APPLICATION ? 'applications/public/' : 'toolsets/public/';
      const leaf = 'app__stable';
      const parentFolders = `${'a'.repeat(200)}/${'b'.repeat(200)}/${'c'.repeat(200)}/`;
      const padding = 'd'.repeat(900 - prefix.length - parentFolders.length - 1 - leaf.length);
      const folderId = `public/${parentFolders}${padding}/`;
      expect(getAssetDestinationError(folderId, 'app', 'stable', resourceType, t)).toBeNull();
      expect(getAssetDestinationError(folderId, 'app', 'stablea', resourceType, t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.AssetPathTooLong,
      });
      expect(getAssetDestinationError(`public/${'春'.repeat(200)}/`, 'app', '版'.repeat(100), resourceType, t)).toEqual(
        {
          type: ErrorType.LENGTH,
          text: ErrorI18nKey.AssetPathTooLong,
        },
      );
    });

    test('retains the storage path error when both length limits are exceeded', () => {
      expect(getAssetDestinationError('public/', 'app', 'a'.repeat(900), resourceType, t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.AssetPathTooLong,
      });
    });
  });

  test('converts a destination folder version map into exact paths', () => {
    expect(
      getAssetPathsFromVersions('public/team', { app: ['stable', 'preview'], app__internal: ['candidate'] }),
    ).toEqual(['public/team/app__stable', 'public/team/app__preview', 'public/team/app__internal__candidate']);
    expect(getAssetPathsFromVersions('public/')).toEqual([]);
  });
});
