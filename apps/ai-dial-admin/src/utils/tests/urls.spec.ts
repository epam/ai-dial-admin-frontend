import { describe, expect, test } from 'vitest';

import { addTrailingSlash, normalizeUrl, removeSlash } from './url';

describe('url utils', () => {
  describe('addTrailingSlash', () => {
    test('returns empty string for empty input', () => {
      expect(addTrailingSlash('')).toBe('');
      expect(addTrailingSlash()).toBe('');
    });

    test('adds trailing slash when missing', () => {
      expect(addTrailingSlash('api-url')).toBe('api-url/');
    });

    test('keeps single trailing slash when already present', () => {
      expect(addTrailingSlash('api-url/')).toBe('api-url/');
    });
  });

  describe('removeSlash', () => {
    test('removes only leading slash', () => {
      expect(removeSlash('/api-url')).toBe('api-url');
    });

    test('keeps value when no leading slash', () => {
      expect(removeSlash('api-url')).toBe('api-url');
    });
  });

  describe('normalizeUrl', () => {
    test('normalizes api-url and api-url/ to same value without trailing slash by default', () => {
      expect(normalizeUrl('api-url')).toBe('api-url/');
      expect(normalizeUrl('api-url/')).toBe('api-url/');
    });

    test('returns value with trailing slash when requested', () => {
      expect(normalizeUrl('api-url', true)).toBe('api-url/');
      expect(normalizeUrl('api-url/', true)).toBe('api-url/');
    });

    test('trims spaces around url before normalization', () => {
      expect(normalizeUrl('  api-url/  ')).toBe('api-url/');
      expect(normalizeUrl('  api-url  ', true)).toBe('api-url/');
    });

    test('returns empty string for empty-like values', () => {
      expect(normalizeUrl()).toBe('');
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
    });
  });
});
