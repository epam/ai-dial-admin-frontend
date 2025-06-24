import { describe, expect, test } from 'vitest';
import { isJSON } from '../is-valid-json';

describe('Utils :: isJSON', () => {
  test('should return false for undefined', () => {
    expect(isJSON(undefined)).toBe(false);
  });

  test('should return false for non-string input (number)', () => {
    expect(isJSON(123 as any)).toBe(false);
  });

  test('should return false for non-string input (object)', () => {
    expect(isJSON({} as any)).toBe(false);
  });

  test('should return false for invalid JSON string', () => {
    expect(isJSON('not a json')).toBe(false);
  });

  test('should return false for stringified primitive (number)', () => {
    expect(isJSON('123')).toBe(false);
  });

  test('should return true for valid JSON object string', () => {
    expect(isJSON('{"name":"John","age":30}')).toBe(true);
  });

  test('should return true for valid JSON array string', () => {
    expect(isJSON('[1,2,3]')).toBe(true);
  });

  test('should return false for JSON null', () => {
    expect(isJSON('null')).toBe(false);
  });

  test('should return false for JSON string literal (not object)', () => {
    expect(isJSON('"hello"')).toBe(false);
  });
});
