import { describe, expect, test } from 'vitest';
import { isDangerEndpoint, isValidEndpoint, isValidHttpUrl } from '../is-valid-url';

describe('isValidHttpUrl', () => {
  test('returns true for valid http and https URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('https://sub.domain.com/path?query=1')).toBe(true);
  });

  test('returns false for invalid URLs', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });
});

describe('isValidEndpoint', () => {
  test('returns true for valid endpoints', () => {
    expect(isValidEndpoint('http://example.com')).toBe(true);
    expect(isValidEndpoint('https://example.com')).toBe(true);
    expect(isValidEndpoint('https://sub.domain.com/path?query=1')).toBe(true);
    expect(isValidEndpoint('http://example-url-backend:50/')).toBe(true);
    expect(isValidEndpoint('http://localhost')).toBe(true);
    expect(isValidEndpoint('http://localhost:3000/path')).toBe(true);
  });

  test('returns false for invalid endpoints', () => {
    expect(isValidEndpoint('ftp://example.com')).toBe(false);
    expect(isValidEndpoint('not-a-url')).toBe(false);
    expect(isValidEndpoint('')).toBe(false);
    expect(isValidEndpoint('http:/example.com')).toBe(false);
  });
});

describe('isDangerEndpoint', () => {
  test('returns true for http endpoints', () => {
    expect(isDangerEndpoint('http://example.com')).toBe(true);
    expect(isDangerEndpoint('http://sub.domain.com')).toBe(true);
  });

  test('returns false for https and other endpoints', () => {
    expect(isDangerEndpoint('https://example.com')).toBe(false);
    expect(isDangerEndpoint('ftp://example.com')).toBe(false);
    expect(isDangerEndpoint('')).toBe(false);
  });
});
