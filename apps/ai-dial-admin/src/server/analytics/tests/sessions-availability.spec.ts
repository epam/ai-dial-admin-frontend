import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, sessionsSourceApi } from '@/src/app/api/api';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { isSessionsSourceAvailable } from '@/src/server/analytics/sessions-availability';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');

describe('isSessionsSourceAvailable', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearEntitySchemaCache();
  });

  test('is available when a setting is stored, without reading the default table', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({
      success: true,
      response: DEFAULT_SESSIONS_SOURCE_SETTING,
    });

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(true);
    expect(sessionsSourceApi.getSetting).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(analyticsDataApi.getEntitySchema).not.toHaveBeenCalled();
  });

  test('is available when nothing is stored and the default table exists', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({ success: true });
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({ success: true, response: { fields: [] } });

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(true);
    expect(analyticsDataApi.getEntitySchema).toHaveBeenCalledWith('sessions', TOKEN_MOCK);
  });

  test('is unavailable when nothing is stored and the default table does not exist', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({ success: true });
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({ success: false, status: 404 });

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(false);
  });

  test('stays available when the default table schema fails for another reason', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({ success: true });
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({ success: false, status: 500 });

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(true);
  });

  test('stays available when the setting cannot be read, so the page can report why', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({ success: false, status: 403 });

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(true);
    expect(analyticsDataApi.getEntitySchema).not.toHaveBeenCalled();
  });

  test('stays available when the read throws', async () => {
    vi.mocked(sessionsSourceApi.getSetting).mockRejectedValue(new Error('down'));

    expect(await isSessionsSourceAvailable(TOKEN_MOCK)).toBe(true);
  });
});
