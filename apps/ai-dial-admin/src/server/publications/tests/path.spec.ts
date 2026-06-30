import { describe, expect, test } from 'vitest';
import {
  buildEncodedPath,
  decodeCorePath,
  encodeCorePath,
  encodeFolderPath,
  ensureTrailingSlash,
  extractNameAndVersion,
  getVersionedName,
  parseEncodedVersionedPath,
  parsePath,
  parseVersionedPath,
  stripPrefix,
  stripTrailingSlash,
} from '../path';

describe('Server :: Publications :: path', () => {
  test('ensureTrailingSlash', () => {
    expect(ensureTrailingSlash('a/b')).toBe('a/b/');
    expect(ensureTrailingSlash('a/b/')).toBe('a/b/');
    expect(ensureTrailingSlash('')).toBe('/');
    expect(ensureTrailingSlash(undefined)).toBe('/');
  });

  test('stripTrailingSlash', () => {
    expect(stripTrailingSlash('a/b/')).toBe('a/b');
    expect(stripTrailingSlash('a/b')).toBe('a/b');
  });

  test('stripPrefix', () => {
    expect(stripPrefix('prompts/folder/x', 'prompts/')).toBe('folder/x');
    expect(stripPrefix('folder/x', 'prompts/')).toBe('folder/x');
  });

  test('encode / decode core path per segment', () => {
    expect(encodeCorePath('bucket/my folder/a b')).toBe('bucket/my%20folder/a%20b');
    expect(decodeCorePath('bucket/my%20folder/a%20b')).toBe('bucket/my folder/a b');
  });

  test('extractNameAndVersion', () => {
    expect(extractNameAndVersion('Name')).toEqual({ name: 'Name' });
    expect(extractNameAndVersion('Name__1.0')).toEqual({ name: 'Name', version: '1.0' });
    expect(extractNameAndVersion('My__App__2')).toEqual({ name: 'My__App', version: '2' });
  });

  test('parsePath splits folderId and name', () => {
    expect(parsePath('folder/sub/file.txt')).toEqual({
      path: 'folder/sub/file.txt',
      folderId: 'folder/sub/',
      name: 'file.txt',
    });
    expect(parsePath('folder/sub/')).toEqual({ path: 'folder/sub', folderId: 'folder/', name: 'sub' });
    expect(() => parsePath('noslash')).toThrow();
  });

  test('parseVersionedPath splits name and version', () => {
    expect(parseVersionedPath('folder/Name__1.0')).toEqual({
      path: 'folder/Name__1.0',
      folderId: 'folder/',
      name: 'Name',
      version: '1.0',
    });
    expect(() => parseVersionedPath('noslash')).toThrow();
  });

  test('parseEncodedVersionedPath strips prefix, decodes and parses', () => {
    expect(parseEncodedVersionedPath('prompts/my%20folder/Name__1', 'prompts/')).toEqual({
      path: 'my folder/Name__1',
      folderId: 'my folder/',
      name: 'Name',
      version: '1',
    });
  });

  test('getVersionedName', () => {
    expect(getVersionedName('Name')).toBe('Name');
    expect(getVersionedName('Name', '')).toBe('Name');
    expect(getVersionedName('Name', '  ')).toBe('Name');
    expect(getVersionedName('Name', '2')).toBe('Name__2');
  });

  test('buildEncodedPath joins folder + versioned name and encodes', () => {
    expect(buildEncodedPath('applications/my folder/', 'My App', '1.0')).toBe('applications/my%20folder/My%20App__1.0');
    expect(buildEncodedPath('prompts/f/', 'P')).toBe('prompts/f/P');
  });

  test('encodeFolderPath encodes segments and ensures trailing slash', () => {
    expect(encodeFolderPath('my folder/sub')).toBe('my%20folder/sub/');
    expect(encodeFolderPath('folder/')).toBe('folder/');
    expect(encodeFolderPath('')).toBe('');
  });
});
