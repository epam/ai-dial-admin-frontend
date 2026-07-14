import { describe, expect, test } from 'vitest';

import { IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { createHeadersForCreate, createIfMatchHeaders, createIfNoneMatchHeaders } from '../asset-headers';

describe('Server :: Core :: asset-headers', () => {
  test('createIfMatchHeaders returns no header for null/undefined/sentinel etag', () => {
    expect(createIfMatchHeaders(undefined)).toEqual({});
    expect(createIfMatchHeaders(null)).toEqual({});
    expect(createIfMatchHeaders('*')).toEqual({});
  });

  test('createIfMatchHeaders returns If-Match for a concrete etag', () => {
    expect(createIfMatchHeaders('abc123')).toEqual({ [IF_MATCH]: 'abc123' });
  });

  test('createIfNoneMatchHeaders returns no header for null/undefined/sentinel etag', () => {
    expect(createIfNoneMatchHeaders(undefined)).toEqual({});
    expect(createIfNoneMatchHeaders(null)).toEqual({});
    expect(createIfNoneMatchHeaders('*')).toEqual({});
  });

  test('createIfNoneMatchHeaders returns If-None-Match for a concrete etag', () => {
    expect(createIfNoneMatchHeaders('abc123')).toEqual({ [IF_NONE_MATCH]: 'abc123' });
  });

  test('createHeadersForCreate without override rejects existing resources', () => {
    expect(createHeadersForCreate(false)).toEqual({ [IF_NONE_MATCH]: '*' });
    expect(createHeadersForCreate(false, 'ignored-etag')).toEqual({ [IF_NONE_MATCH]: '*' });
  });

  test('createHeadersForCreate with override behaves like an update', () => {
    expect(createHeadersForCreate(true)).toEqual({});
    expect(createHeadersForCreate(true, 'abc123')).toEqual({ [IF_MATCH]: 'abc123' });
  });
});
