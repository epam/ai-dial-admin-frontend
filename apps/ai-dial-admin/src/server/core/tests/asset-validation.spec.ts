import { describe, expect, test } from 'vitest';

import { isValidEndpointUrl, isValidMaxInputAttachments, validateApplicationResourceFields } from '../asset-validation';

describe('Server :: Core :: asset-validation', () => {
  test('isValidEndpointUrl accepts blank values', () => {
    expect(isValidEndpointUrl(undefined)).toBe(true);
    expect(isValidEndpointUrl(null)).toBe(true);
    expect(isValidEndpointUrl('')).toBe(true);
  });

  test('isValidEndpointUrl accepts absolute and relative-path endpoints', () => {
    expect(isValidEndpointUrl('https://example.com/viewer')).toBe(true);
    expect(isValidEndpointUrl('http://internal-host:8080/path')).toBe(true);
  });

  test('isValidEndpointUrl rejects URLs with disallowed characters or a bad authority', () => {
    expect(isValidEndpointUrl('https://exa mple.com')).toBe(false);
    expect(isValidEndpointUrl('https://exa<mple>.com')).toBe(false);
  });

  test('isValidMaxInputAttachments accepts blank and in-range values', () => {
    expect(isValidMaxInputAttachments(undefined)).toBe(true);
    expect(isValidMaxInputAttachments(null)).toBe(true);
    expect(isValidMaxInputAttachments(1)).toBe(true);
    expect(isValidMaxInputAttachments(1000)).toBe(true);
  });

  test('isValidMaxInputAttachments rejects non-positive, over-limit, or non-integer values', () => {
    expect(isValidMaxInputAttachments(0)).toBe(false);
    expect(isValidMaxInputAttachments(-1)).toBe(false);
    expect(isValidMaxInputAttachments(1001)).toBe(false);
    expect(isValidMaxInputAttachments(1.5)).toBe(false);
  });

  test('validateApplicationResourceFields rejects invalid fields identically for create and update shapes', () => {
    const invalid = { viewerUrl: 'https://exa mple.com', editorUrl: 'https://ok.com', maxInputAttachments: 2000 };

    const errors = validateApplicationResourceFields(invalid);

    expect(errors.viewerUrl).toBeDefined();
    expect(errors.editorUrl).toBeUndefined();
    expect(errors.maxInputAttachments).toBeDefined();
  });

  test('validateApplicationResourceFields returns no errors for a valid payload', () => {
    expect(
      validateApplicationResourceFields({
        viewerUrl: 'https://ok.com/viewer',
        editorUrl: 'https://ok.com/editor',
        maxInputAttachments: 10,
      }),
    ).toEqual({});
  });
});
