import { ErrorI18nKey } from '@/src/constants/i18n';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { MAX_ASSET_PATH_BYTES } from '@/src/constants/validation';
import { FieldError, Translate } from '@/src/models/error';
import { getVersionedName } from '@/src/server/publications/path';
import { ErrorType } from '@/src/types/error-type';
import { ResourceType } from '@/src/types/resource-type';
import { addTrailingSlash } from '@/src/utils/url';

const hasForbiddenPathCharacters = (value: string): boolean =>
  Array.from(value).some((character) => character.charCodeAt(0) < 32 || ['/', '{', '}', '"'].includes(character));

export const getAssetVersionError = (version: string | undefined, t: Translate): FieldError | null => {
  if (!version?.trim()) {
    return { type: ErrorType.EMPTY, text: t(ErrorI18nKey.RequiredField) };
  }
  if (version.includes('__') || version.startsWith('_')) {
    return { type: ErrorType.FORBIDDEN_CHARS, text: t(ErrorI18nKey.AmbiguousAssetVersion) };
  }
  if (hasForbiddenPathCharacters(version) || version.endsWith('.')) {
    return { type: ErrorType.INVALID, text: t(ErrorI18nKey.InvalidAssetPath) };
  }
  return null;
};

export const getAssetDestinationError = (
  folderId: string,
  name: string,
  version: string | undefined,
  resourceType: ResourceType,
  t: Translate,
  existingPaths?: readonly string[],
): FieldError | null => {
  const versionError = getAssetVersionError(version, t);
  if (versionError) return versionError;

  const path = `${addTrailingSlash(folderId)}${getVersionedName(name, version)}`;
  const segments = path.split('/');
  if (segments.some((segment) => !segment || hasForbiddenPathCharacters(segment) || segment.endsWith('.'))) {
    return { type: ErrorType.INVALID, text: t(ErrorI18nKey.InvalidAssetPath) };
  }
  // Core limits the entire decoded storage path, including the type and bucket, in UTF-8 bytes.
  if (new Blob([`${RESOURCE_TYPE_PREFIX[resourceType]}${path}`]).size > MAX_ASSET_PATH_BYTES) {
    return { type: ErrorType.LENGTH, text: t(ErrorI18nKey.AssetPathTooLong, { max: MAX_ASSET_PATH_BYTES }) };
  }
  if (existingPaths?.includes(path)) {
    return { type: ErrorType.EXISTING, text: t(ErrorI18nKey.NameVersionCombination) };
  }
  return null;
};

export const getAssetPathsFromVersions = (folderId: string, versionsMap?: Record<string, string[]>): string[] =>
  Object.entries(versionsMap || {}).flatMap(([name, versions]) =>
    versions.map((version) => `${addTrailingSlash(folderId)}${getVersionedName(name, version)}`),
  );
