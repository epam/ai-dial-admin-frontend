import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { SessionsSourceSettingDto } from '@/src/models/analytics/sessions-source';
import { SESSIONS_SOURCE_URL, SessionsSourceApi } from '@/src/server/analytics/sessions-source-api';
import { settingToDto } from '@/src/utils/analytics/sessions-source';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const stored: SessionsSourceSettingDto = {
  ...settingToDto(DEFAULT_SESSIONS_SOURCE_SETTING),
  updated_at: '2026-11-11T10:00:00Z',
  updated_by: 'admin',
};

const errorBody = (status: number, error: string, message: string) => ({
  status,
  body: JSON.stringify({ error, message }),
  ...JSON_HEADERS,
});

describe('Server :: SessionsSourceApi', () => {
  const instance = new SessionsSourceApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getSetting issues GET v1/settings/sessions-source and maps the stored setting', async () => {
    fetch.mockResponseOnce(JSON.stringify(stored), JSON_HEADERS);

    const read = await instance.getSetting(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${SESSIONS_SOURCE_URL}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(read).toEqual(expect.objectContaining({ success: true, response: DEFAULT_SESSIONS_SOURCE_SETTING }));
  });

  test('getSetting answers success with no setting when none is stored', async () => {
    fetch.mockResponseOnce(() => errorBody(404, 'setting_not_found', 'The sessions-source setting is not configured'));

    expect(await instance.getSetting(TOKEN_MOCK)).toEqual({ success: true });
  });

  test('getSetting reports a forbidden read as a failure, not as an unset setting', async () => {
    fetch.mockResponseOnce(() => errorBody(403, 'forbidden', 'Access denied'));

    const read = await instance.getSetting(TOKEN_MOCK);

    expect(read.success).toBe(false);
    expect(read.status).toBe(403);
    expect(read.response).toBeUndefined();
  });

  test('putSetting issues PUT with the service body and maps the stored setting', async () => {
    fetch.mockResponseOnce(JSON.stringify(stored), JSON_HEADERS);

    const saved = await instance.putSetting(DEFAULT_SESSIONS_SOURCE_SETTING, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${SESSIONS_SOURCE_URL}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(settingToDto(DEFAULT_SESSIONS_SOURCE_SETTING)),
      }),
    );
    expect(saved).toEqual(expect.objectContaining({ success: true, response: DEFAULT_SESSIONS_SOURCE_SETTING }));
  });

  test('putSetting carries the service message on a rejected setting', async () => {
    fetch.mockResponseOnce(() => errorBody(422, 'validation_error', "roles.title names unknown field 'title'"));

    const saved = await instance.putSetting(DEFAULT_SESSIONS_SOURCE_SETTING, TOKEN_MOCK);

    expect(saved.success).toBe(false);
    expect(saved.status).toBe(422);
    expect(saved.errorMessage).toContain('roles.title');
  });
});
