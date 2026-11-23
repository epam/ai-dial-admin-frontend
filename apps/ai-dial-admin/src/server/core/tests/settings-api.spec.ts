import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { GlobalSettings } from '@/src/models/system-properties';
import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { SettingsApi } from '../settings-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const SETTINGS_URL = 'http://core.test/v1/settings/platform/global';
const JSON_HEADERS = { 'content-type': 'application/json' };
const SETTINGS: GlobalSettings = { globalInterceptors: ['global'] };

/** The SDK hands `fetch` a `Request`; `coreFetch` passes the final headers as the second argument. */
const sentRequest = () => fetch.mock.calls[0] as [Request, RequestInit];
const sentHeaders = (): Headers => new Headers(sentRequest()[1].headers);
const sentBody = async (): Promise<unknown> => JSON.parse(await sentRequest()[0].clone().text());

describe('SettingsApi.globalSettings', () => {
  const instance = new SettingsApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('reads the Core global-settings singleton without a conditional header', async () => {
    fetch.mockResponseOnce(JSON.stringify(SETTINGS), { headers: JSON_HEADERS });

    const result = await instance.globalSettings(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: SETTINGS_URL, method: 'GET' }),
      expect.anything(),
    );
    expect(sentHeaders().has('If-None-Match')).toBe(false);
    expect(result).toEqual({ success: true, response: SETTINGS, etag: undefined });
  });

  test('resolves a missing settings blob to a 404 failure', async () => {
    fetch.mockResponseOnce('', { status: 404, headers: { 'content-length': '0' } });

    const result = await instance.globalSettings(TOKEN_MOCK);

    expect(result).toMatchObject({ success: false, status: 404 });
  });

  test('omits name and status but keeps any other field, including metadata Core adds later (denylist)', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ...SETTINGS, name: 'global', status: 'ok', futureField: 1 }), {
      headers: JSON_HEADERS,
    });

    const result = await instance.globalSettings(TOKEN_MOCK);

    expect(result.response).toEqual({ ...SETTINGS, futureField: 1 });
  });
});

describe('SettingsApi.getSystemProperties', () => {
  const instance = new SettingsApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(JSON.stringify({ ...SETTINGS, name: 'global', status: 'ok' }), { headers: JSON_HEADERS });
  });

  test('sends no If-None-Match for DEFAULT_ETAG', async () => {
    const result = await instance.getSystemProperties(TOKEN_MOCK, DEFAULT_ETAG);

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: SETTINGS_URL, method: 'GET' }),
      expect.anything(),
    );
    expect(sentHeaders().has('If-None-Match')).toBe(false);
    expect(result.response).toEqual(SETTINGS);
  });

  test('sends If-None-Match for a real etag', async () => {
    await instance.getSystemProperties(TOKEN_MOCK, '"e1"');

    expect(sentHeaders().get('If-None-Match')).toBe('"e1"');
    expect(sentHeaders().get('authorization')).toBe('Bearer access_token_mock');
  });

  test('resolves an aborted read to the cancelled envelope', async () => {
    fetch.resetMocks();
    fetch.mockRejectOnce(new DOMException('Aborted', 'AbortError'));

    const result = await instance.getSystemProperties(TOKEN_MOCK, DEFAULT_ETAG);

    expect(result).toEqual({ success: false, status: 0, errorMessage: 'Request cancelled' });
  });
});

describe('SettingsApi.updateSystemProperties', () => {
  const instance = new SettingsApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('PUTs the settings with If-Match for a real etag and returns the new etag', async () => {
    fetch.mockResponseOnce('{}', { headers: { ...JSON_HEADERS, etag: '"e2"' } });

    const result = await instance.updateSystemProperties(SETTINGS, TOKEN_MOCK, '"e1"');

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: SETTINGS_URL, method: 'PUT' }),
      expect.anything(),
    );
    expect(sentHeaders().get('If-Match')).toBe('"e1"');
    expect(await sentBody()).toEqual(SETTINGS);
    expect(result).toMatchObject({ success: true, etag: '"e2"' });
  });

  test('sends If-Match: * for DEFAULT_ETAG, asserting the settings exist', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.updateSystemProperties(SETTINGS, TOKEN_MOCK, DEFAULT_ETAG);

    expect(sentHeaders().get('If-Match')).toBe('*');
  });

  test('sends no If-Match for an undefined etag, making the write a create', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.updateSystemProperties(SETTINGS, TOKEN_MOCK, undefined);

    expect(sentHeaders().has('If-Match')).toBe(false);
  });

  test('resolves a stale etag to a 412 failure', async () => {
    fetch.mockResponseOnce('', { status: 412, headers: { 'content-length': '0' } });

    const result = await instance.updateSystemProperties(SETTINGS, TOKEN_MOCK, '"stale"');

    expect(result).toMatchObject({ success: false, status: 412 });
  });

  test('writes back an unknown field from the read, by design, without name or status', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ...SETTINGS, name: 'global', status: 'ok', futureField: 1 }), {
      headers: JSON_HEADERS,
    });
    const read = await instance.getSystemProperties(TOKEN_MOCK, DEFAULT_ETAG);
    fetch.resetMocks();
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.updateSystemProperties(read.response as GlobalSettings, TOKEN_MOCK, DEFAULT_ETAG);

    expect(await sentBody()).toEqual({ ...SETTINGS, futureField: 1 });
  });
});
