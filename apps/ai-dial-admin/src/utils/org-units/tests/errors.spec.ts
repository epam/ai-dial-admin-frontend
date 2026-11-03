import { describe, expect, test } from 'vitest';

import {
  OrgUnitErrorKind,
  getContentItemName,
  isFilesMarkerUrl,
  isFolderMarkerUrl,
  mapOrgUnitError,
  parseUnitContentBlock,
  toFilePath,
} from '../errors';

describe('mapOrgUnitError', () => {
  test.each([
    [400, OrgUnitErrorKind.FIELD],
    [409, OrgUnitErrorKind.FIELD],
    [403, OrgUnitErrorKind.FORBIDDEN],
    [404, OrgUnitErrorKind.NOT_FOUND],
    [500, OrgUnitErrorKind.UNAVAILABLE],
    [undefined, OrgUnitErrorKind.UNAVAILABLE],
  ])('maps status %s to %s', (status, kind) => {
    expect(mapOrgUnitError({ success: false, status, errorMessage: 'm' })).toEqual({ kind, status, message: 'm' });
  });
});

describe('parseUnitContentBlock', () => {
  test('returns the listed urls', () => {
    expect(
      parseUnitContentBlock(
        'public/A still holds content: applications/public/A/app__1.0.0, files/public/A/.dial_folder, …. Delete or move it first.',
      ),
    ).toEqual(['applications/public/A/app__1.0.0', 'files/public/A/.dial_folder', '…']);
  });

  test('handles the message for a unit with units below it', () => {
    expect(
      parseUnitContentBlock(
        'public/A and the units below it still hold content: files/public/A/b/x. Delete or move it first.',
      ),
    ).toEqual(['files/public/A/b/x']);
  });

  test.each([undefined, '', 'Unit is busy'])('returns undefined for %s', (message) => {
    expect(parseUnitContentBlock(message)).toBeUndefined();
  });
});

describe('content item helpers', () => {
  test('getContentItemName keeps only the decoded last segment', () => {
    expect(getContentItemName('applications/public/A/app__1.0.0')).toBe('app__1.0.0');
    expect(getContentItemName('files/public/A/my%20file.txt')).toBe('my file.txt');
  });

  test('isFolderMarkerUrl matches only a files-tree marker', () => {
    expect(isFolderMarkerUrl('files/public/A/.dial_folder')).toBe(true);
    expect(isFolderMarkerUrl('files/public/A/.dial_folder.txt')).toBe(false);
    expect(isFolderMarkerUrl('public/A/.dial_folder')).toBe(true);
    expect(isFolderMarkerUrl('.dial_folder')).toBe(true);
  });

  test('isFilesMarkerUrl matches only a marker in the files tree', () => {
    expect(isFilesMarkerUrl('files/public/A/.dial_folder')).toBe(true);
    expect(isFilesMarkerUrl('public/A/.dial_folder')).toBe(false);
  });

  test('toFilePath drops the files prefix', () => {
    expect(toFilePath('files/public/A/.dial_folder')).toBe('public/A/.dial_folder');
  });
});
