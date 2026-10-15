import { describe, expect, test } from 'vitest';

import {
  createArrayItems,
  createStructuredObjectValue,
  formatBindingValue,
  getArrayItemText,
  isFlatStringArray,
  isPlainObject,
  safeStringify,
  toPrimitiveValue,
} from '../utils';

describe('AdaptiveValueRow utils', () => {
  test('Should detect flat string arrays', () => {
    expect(isFlatStringArray(['a', 'b'])).toBe(true);
    expect(isFlatStringArray(['a', 1])).toBe(false);
    expect(isFlatStringArray('nope')).toBe(false);
  });

  test('Should detect plain objects', () => {
    expect(isPlainObject({ key: 'value' })).toBe(true);
    expect(isPlainObject(['a'])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  test('Should safely stringify values', () => {
    expect(safeStringify({ a: 1 })).toBe('{"a":1}');

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(safeStringify(circular)).toBe('[object Object]');
  });

  test('Should get array item text for string and object', () => {
    expect(getArrayItemText('alpha')).toBe('alpha');
    expect(getArrayItemText({ id: 1 })).toBe('{"id":1}');
  });

  test('Should create array item models with long/structured flags', () => {
    const items = createArrayItems(['short', { payload: 'x'.repeat(150) }]);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ index: 0, isStructured: false, isItemLong: false });
    expect(items[1]).toMatchObject({ index: 1, isStructured: true, isItemLong: true });
  });

  test('Should create structured object preview model', () => {
    const value = createStructuredObjectValue({ payload: 'x'.repeat(180) });

    expect(value.typeChip).toBe('Object');
    expect(value.isLong).toBe(true);
    expect(value.displayText.endsWith('...')).toBe(true);
    expect(value.rawText).toContain('"payload"');
  });

  test('Should convert primitives to string safely', () => {
    expect(toPrimitiveValue(42)).toBe('42');
    expect(toPrimitiveValue(null)).toBe('null');
    expect(toPrimitiveValue('text')).toBe('text');
  });

  test('Should format binding values for display', () => {
    expect(formatBindingValue(null)).toBe('');
    expect(formatBindingValue(undefined)).toBe('');
    expect(formatBindingValue('plain text')).toBe('plain text');
    expect(formatBindingValue(42)).toBe('42');
    expect(formatBindingValue(true)).toBe('true');
    expect(formatBindingValue({ key: 'value' })).toBe('{"key":"value"}');
    expect(formatBindingValue(['a', 'b'])).toBe('["a","b"]');
    expect(formatBindingValue({ nested: { count: 1 } })).toBe('{"nested":{"count":1}}');
  });

  test('Should fall back when binding value cannot be stringified', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(formatBindingValue(circular)).toBe('[object Object]');
  });
});
