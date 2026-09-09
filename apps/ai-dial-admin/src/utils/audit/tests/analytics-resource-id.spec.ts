import { describe, expect, test } from 'vitest';
import { getTableNameFromAnalyticsResourceId, isResourceIdInTableScope } from '../analytics-resource-id';

describe('Audit :: getTableNameFromAnalyticsResourceId', () => {
  test('returns the table half of a column identifier', () => {
    expect(getTableNameFromAnalyticsResourceId('orders:total')).toBe('orders');
  });

  test('returns the whole value when the identifier carries no separator', () => {
    expect(getTableNameFromAnalyticsResourceId('orders')).toBe('orders');
  });

  test('splits on the first separator when the column name contains one', () => {
    expect(getTableNameFromAnalyticsResourceId('orders:total:net')).toBe('orders');
  });

  test('keeps an underscored table name whole', () => {
    expect(getTableNameFromAnalyticsResourceId('my_orders:total')).toBe('my_orders');
  });

  test('returns an empty string for an empty identifier', () => {
    expect(getTableNameFromAnalyticsResourceId('')).toBe('');
  });

  test('returns an empty string when the identifier starts with the separator', () => {
    expect(getTableNameFromAnalyticsResourceId(':total')).toBe('');
  });

  test('returns undefined when no identifier is given', () => {
    expect(getTableNameFromAnalyticsResourceId(undefined)).toBeUndefined();
  });

  test('returns undefined when called with no argument', () => {
    expect(getTableNameFromAnalyticsResourceId()).toBeUndefined();
  });
});

describe('Audit :: isResourceIdInTableScope', () => {
  const tableName = 'orders';

  test('accepts the table definition identifier itself', () => {
    expect(isResourceIdInTableScope('orders', tableName)).toBe(true);
  });

  test('accepts a column of that table', () => {
    expect(isResourceIdInTableScope('orders:total', tableName)).toBe(true);
  });

  test('accepts a column whose own name contains the separator', () => {
    expect(isResourceIdInTableScope('orders:total:net', tableName)).toBe(true);
  });

  test('rejects a similarly named table that the contains filter also matches', () => {
    expect(isResourceIdInTableScope('my_orders', tableName)).toBe(false);
  });

  test('rejects a column of a similarly named table that the contains filter also matches', () => {
    expect(isResourceIdInTableScope('my_orders:total', tableName)).toBe(false);
  });

  test('rejects a table whose name merely starts with the table name', () => {
    expect(isResourceIdInTableScope('orders_archive', tableName)).toBe(false);
  });

  test('rejects a column of a table whose name merely starts with the table name', () => {
    expect(isResourceIdInTableScope('orders_archive:total', tableName)).toBe(false);
  });

  test('rejects an unrelated identifier', () => {
    expect(isResourceIdInTableScope('conversations:role', tableName)).toBe(false);
  });

  test('rejects an empty identifier', () => {
    expect(isResourceIdInTableScope('', tableName)).toBe(false);
  });

  test('rejects an empty table name rather than matching every identifier', () => {
    expect(isResourceIdInTableScope('orders:total', '')).toBe(false);
    expect(isResourceIdInTableScope(':total', '')).toBe(false);
  });

  test('returns false when the identifier is undefined', () => {
    expect(isResourceIdInTableScope(undefined, tableName)).toBe(false);
  });

  test('returns false when the table name is undefined', () => {
    expect(isResourceIdInTableScope('orders:total', undefined)).toBe(false);
  });

  test('returns false when called with no arguments', () => {
    expect(isResourceIdInTableScope()).toBe(false);
  });
});
