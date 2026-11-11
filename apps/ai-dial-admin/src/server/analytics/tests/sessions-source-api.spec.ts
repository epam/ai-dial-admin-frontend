import { describe, expect, test } from 'vitest';

import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { SessionsRole } from '@/src/models/analytics/sessions-source';
import { SessionsSourceApi } from '@/src/server/analytics/sessions-source-api';

describe('SessionsSourceApi', () => {
  test('reads no setting before one is saved', async () => {
    expect(await new SessionsSourceApi({ stored: null }).getSetting()).toEqual({ success: true });
  });

  test('reads back the setting it saved', async () => {
    const api = new SessionsSourceApi({ stored: null });
    const setting = { baseTable: 'runs', roles: { [SessionsRole.SessionId]: 'id', [SessionsRole.Time]: 'at' } };

    const saved = await api.putSetting(setting);

    expect(saved.success).toBe(true);
    expect(saved.response?.baseTable).toBe('runs');
    expect((await api.getSetting()).response).toEqual(saved.response);
  });

  test('replaces the previously saved setting', async () => {
    const api = new SessionsSourceApi({ stored: null });

    await api.putSetting(DEFAULT_SESSIONS_SOURCE_SETTING);
    await api.putSetting({ ...DEFAULT_SESSIONS_SOURCE_SETTING, baseTable: 'other' });

    expect((await api.getSetting()).response?.baseTable).toBe('other');
  });

  test('shares one store across instances of the default store', async () => {
    await new SessionsSourceApi().putSetting({ ...DEFAULT_SESSIONS_SOURCE_SETTING, baseTable: 'shared' });

    expect((await new SessionsSourceApi().getSetting()).response?.baseTable).toBe('shared');
  });
});
