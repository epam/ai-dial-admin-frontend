import { describe, test, expect } from 'vitest';
import { getApiHeaders, getAuthorizationHeader } from '../api-headers';

const APPLICATION_JSON_TYPE = 'application/json';

describe('getAuthorizationHeader', () => {
  test('returns empty object if token is undefined', () => {
    expect(getAuthorizationHeader(undefined)).toEqual({});
  });

  test('returns empty object if token is null', () => {
    expect(getAuthorizationHeader(null)).toEqual({});
  });

  test('returns authorization header if token is present', () => {
    const token = { token: 'abc123' };
    expect(getAuthorizationHeader(token as any)).toEqual({ authorization: 'Bearer abc123' });
  });

  test('returns authorization header with undefined access_token', () => {
    const token = {};
    expect(getAuthorizationHeader(token as any)).toEqual({ authorization: 'Bearer undefined' });
  });
});

describe('getApiHeaders', () => {
  test('returns headers with Content-Type and Accept', () => {
    const headers = getApiHeaders();
    expect(headers['Content-Type']).toBe(APPLICATION_JSON_TYPE);
    expect(headers['Accept']).toBe(APPLICATION_JSON_TYPE);
    expect(headers.authorization).toBeUndefined();
  });

  test('returns headers with authorization if token is present', () => {
    const token = { token: 'xyz789' };
    const headers = getApiHeaders(token as any);
    expect(headers['Content-Type']).toBe(APPLICATION_JSON_TYPE);
    expect(headers['Accept']).toBe(APPLICATION_JSON_TYPE);
    expect(headers.authorization).toBe('Bearer xyz789');
  });
});
