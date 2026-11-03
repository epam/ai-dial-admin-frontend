import { UpstreamAuthType } from '@/src/models/dial/model';
import {
  createUpstreamAuth,
  isUpstreamAuthEqual,
  isUpstreamAuthKeyRequired,
  isValidUpstreamHeaderName,
  normalizeUpstreamAuth,
} from '@/src/utils/models/upstream-auth';

describe('normalizeUpstreamAuth', () => {
  test('defaults a missing value to API_KEY', () => {
    expect(normalizeUpstreamAuth(undefined)).toEqual({ type: UpstreamAuthType.API_KEY });
    expect(normalizeUpstreamAuth(null)).toEqual({ type: UpstreamAuthType.API_KEY });
  });

  test('lifts the string form into an object, case-insensitively', () => {
    expect(normalizeUpstreamAuth('bearer')).toEqual({ type: UpstreamAuthType.BEARER });
  });

  test('keeps headerName only when it is set', () => {
    expect(normalizeUpstreamAuth({ type: UpstreamAuthType.CUSTOM_HEADER, headerName: 'X-Key' })).toEqual({
      type: UpstreamAuthType.CUSTOM_HEADER,
      headerName: 'X-Key',
    });
    expect(normalizeUpstreamAuth({ type: UpstreamAuthType.API_KEY, headerName: undefined })).toEqual({
      type: UpstreamAuthType.API_KEY,
    });
  });
});

describe('createUpstreamAuth', () => {
  test('drops headerName for types that do not use it', () => {
    expect(createUpstreamAuth(UpstreamAuthType.BEARER, 'X-Key')).toEqual({ type: UpstreamAuthType.BEARER });
  });

  test('starts CUSTOM_HEADER with an empty name', () => {
    expect(createUpstreamAuth(UpstreamAuthType.CUSTOM_HEADER)).toEqual({
      type: UpstreamAuthType.CUSTOM_HEADER,
      headerName: '',
    });
  });
});

describe('isUpstreamAuthEqual', () => {
  test('treats a missing value as API_KEY and the string form as the object form', () => {
    expect(isUpstreamAuthEqual(undefined, { type: UpstreamAuthType.API_KEY })).toBe(true);
    expect(isUpstreamAuthEqual('BEARER', { type: UpstreamAuthType.BEARER })).toBe(true);
  });

  test('compares headerName for CUSTOM_HEADER', () => {
    const a = { type: UpstreamAuthType.CUSTOM_HEADER, headerName: 'X-A' };
    expect(isUpstreamAuthEqual(a, { ...a })).toBe(true);
    expect(isUpstreamAuthEqual(a, { ...a, headerName: 'X-B' })).toBe(false);
  });
});

describe('isUpstreamAuthKeyRequired', () => {
  test('is never required for API_KEY', () => {
    expect(isUpstreamAuthKeyRequired({ type: UpstreamAuthType.API_KEY }, { type: UpstreamAuthType.BEARER })).toBe(
      false,
    );
  });

  test('is required when a non-default auth differs from the saved one', () => {
    expect(isUpstreamAuthKeyRequired({ type: UpstreamAuthType.BEARER }, undefined)).toBe(true);
    expect(
      isUpstreamAuthKeyRequired(
        { type: UpstreamAuthType.CUSTOM_HEADER, headerName: 'X-B' },
        { type: UpstreamAuthType.CUSTOM_HEADER, headerName: 'X-A' },
      ),
    ).toBe(true);
  });

  test('is not required when the saved auth is unchanged', () => {
    expect(isUpstreamAuthKeyRequired({ type: UpstreamAuthType.BEARER }, { type: UpstreamAuthType.BEARER })).toBe(false);
  });
});

describe('header name validation', () => {
  test.each(['X-Api-Key', 'x_token', "a!#$%&'*+.^_`|~-"])('accepts %s', (name) => {
    expect(isValidUpstreamHeaderName(name)).toBe(true);
  });

  test.each([undefined, '', 'has space', 'bad:name'])('rejects %s', (name) => {
    expect(isValidUpstreamHeaderName(name)).toBe(false);
  });
});
