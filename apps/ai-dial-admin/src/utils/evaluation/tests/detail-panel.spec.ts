import { describe, expect, it } from 'vitest';

import { ViewerContentType } from '@/src/types/evaluation';

import { beautifyValue, formatContent, parseValue } from '../detail-panel';

describe('parseValue', () => {
  it('returns displayText, rawText, and isLong false for a short plain string', () => {
    const result = parseValue('hello');
    expect(result).toEqual({ displayText: 'hello', rawText: 'hello', isLong: false });
  });

  it('marks a plain string longer than 100 chars as isLong true', () => {
    const long = 'a'.repeat(101);
    const result = parseValue(long);
    expect(result.isLong).toBe(true);
    expect(result.displayText).toBe(long);
    expect(result.rawText).toBe(long);
    expect(result.typeChip).toBeUndefined();
  });

  it('parses a JSON array and returns correct shape', () => {
    const arr = [{ id: 1 }, { id: 2 }];
    const input = JSON.stringify(arr);
    const result = parseValue(input);
    expect(result.typeChip).toBe('Array·2');
    expect(result.isLong).toBe(true);
    expect(result.rawText).toBe(JSON.stringify(arr, null, 2));
    expect(result.displayText).toContain('...');
  });

  it('parses an empty JSON array correctly', () => {
    const result = parseValue('[]');
    expect(result.typeChip).toBe('Array·0');
    expect(result.displayText).toBe('[]');
    expect(result.isLong).toBe(true);
  });

  it('parses a JSON object and returns correct shape', () => {
    const obj = { key: 'value', num: 42 };
    const input = JSON.stringify(obj);
    const result = parseValue(input);
    expect(result.typeChip).toBe('Object');
    expect(result.isLong).toBe(true);
    expect(result.rawText).toBe(JSON.stringify(obj, null, 2));
    expect(result.displayText).toContain('...');
  });

  it('treats non-JSON string as plain string', () => {
    const result = parseValue('not json at all');
    expect(result.displayText).toBe('not json at all');
    expect(result.rawText).toBe('not json at all');
    expect(result.typeChip).toBeUndefined();
    expect(result.isLong).toBe(false);
  });
});

describe('formatContent', () => {
  it('formats valid JSON content with json contentType', () => {
    const input = '{"a":1}';
    const result = formatContent(input, ViewerContentType.Json);
    expect(result).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('returns content as-is when json parsing fails for json contentType', () => {
    const input = 'not json';
    const result = formatContent(input, ViewerContentType.Json);
    expect(result).toBe('not json');
  });

  it('converts escaped newlines for text contentType', () => {
    const result = formatContent('line1\\nline2', ViewerContentType.Text);
    expect(result).toBe('line1\nline2');
  });

  it('converts escaped tabs for text contentType', () => {
    const result = formatContent('col1\\tcol2', ViewerContentType.Text);
    expect(result).toBe('col1\tcol2');
  });

  it('returns plain text as-is for text contentType with no escape sequences', () => {
    const result = formatContent('plain text', ViewerContentType.Text);
    expect(result).toBe('plain text');
  });
});

describe('beautifyValue', () => {
  it('returns "null" for null', () => {
    expect(beautifyValue(null)).toBe('null');
  });

  it('returns "undefined" for undefined', () => {
    expect(beautifyValue(undefined)).toBe('undefined');
  });

  it('returns pretty-printed JSON for objects', () => {
    const obj = { a: 1, b: 'x' };
    expect(beautifyValue(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  it('returns pretty-printed JSON for arrays', () => {
    const arr = [1, 2, 3];
    expect(beautifyValue(arr)).toBe(JSON.stringify(arr, null, 2));
  });

  it('returns pretty-printed JSON for a string containing JSON object', () => {
    const inner = { key: 'val' };
    const result = beautifyValue(JSON.stringify(inner));
    expect(result).toBe(JSON.stringify(inner, null, 2));
  });

  it('returns the string as-is when it is not JSON', () => {
    expect(beautifyValue('plain string')).toBe('plain string');
  });

  it('converts numbers to string', () => {
    expect(beautifyValue(42)).toBe('42');
  });

  it('converts booleans to string', () => {
    expect(beautifyValue(true)).toBe('true');
    expect(beautifyValue(false)).toBe('false');
  });
});
