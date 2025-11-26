import { describe, expect, test } from 'vitest';
import { SOURCE_TYPE } from './types';
import { isValidSourceField } from './utils';

describe('isValidSourceField', () => {
  test('returns true for valid CONTAINER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'id' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for CONTAINER source without containerId', () => {
    const entity = { source: { $type: SOURCE_TYPE.CONTAINER } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid ADAPTER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'name', completionEndpointPath: 'path' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for ADAPTER source missing fields', () => {
    const entity = { source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'name' } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid RUNNER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.RUNNER, runnerName: 'runner' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for RUNNER source missing runnerName', () => {
    const entity = { source: { $type: SOURCE_TYPE.RUNNER } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid ENDPOINTS source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'http://valid.com' };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for invalid ENDPOINTS source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'invalid-url' };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns false for unknown source type', () => {
    const entity = { source: { $type: 'UNKNOWN' } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns false if source is missing', () => {
    const entity = {};
    expect(isValidSourceField(entity as any)).toBe(false);
  });
});
