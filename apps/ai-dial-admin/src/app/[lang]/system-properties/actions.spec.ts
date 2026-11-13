import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, enrichmentRoutesApi, sessionsSourceApi, settingsApi } from '@/src/app/api/api';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  getEnrichmentRoutes,
  getProperties,
  getSessionsSource,
  getSessionsSourceEntities,
  getSessionsSourceSchema,
  saveEnrichmentRoutes,
  saveSessionsSource,
  updateProperties,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('System properties :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
    clearEntitySchemaCache();
  });

  test('Should call getProperties action', async () => {
    (settingsApi.getSystemProperties as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getProperties('etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(settingsApi.getSystemProperties).toHaveBeenCalledWith(TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateProperties action', async () => {
    (settingsApi.updateSystemProperties as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateProperties({ globalInterceptors: [''] }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(settingsApi.updateSystemProperties).toHaveBeenCalledWith({ globalInterceptors: [''] }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateProperties action with an undefined etag when no settings blob exists yet', async () => {
    (settingsApi.updateSystemProperties as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateProperties({ globalInterceptors: [''] }, undefined);
    expect(settingsApi.updateSystemProperties).toHaveBeenCalledWith(
      { globalInterceptors: [''] },
      TOKEN_MOCK,
      undefined,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should read the enrichment routes with the token', async () => {
    (enrichmentRoutesApi.getRoutes as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getEnrichmentRoutes();

    expect(enrichmentRoutesApi.getRoutes).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should save the enrichment routes with the token', async () => {
    const routes = [{ deployment: 'insights-app', route: 'insights' }];
    (enrichmentRoutesApi.putRoutes as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await saveEnrichmentRoutes(routes);

    expect(enrichmentRoutesApi.putRoutes).toHaveBeenCalledWith(routes, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should read the stored sessions source', async () => {
    const read = { success: true, response: DEFAULT_SESSIONS_SOURCE_SETTING };
    vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue(read);

    const result = await getSessionsSource();
    expect(sessionsSourceApi.getSetting).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(read);
  });

  test('Should save the sessions source without a global settings write', async () => {
    const saved = { success: true, response: DEFAULT_SESSIONS_SOURCE_SETTING };
    vi.mocked(sessionsSourceApi.putSetting).mockResolvedValue(saved);

    const result = await saveSessionsSource(DEFAULT_SESSIONS_SOURCE_SETTING);
    expect(sessionsSourceApi.putSetting).toHaveBeenCalledWith(DEFAULT_SESSIONS_SOURCE_SETTING, TOKEN_MOCK);
    expect(settingsApi.updateSystemProperties).not.toHaveBeenCalled();
    expect(result).toBe(saved);
  });

  test('Should return a failed sessions source save as the service reported it', async () => {
    const failure = { success: false, errorHeader: 'Bad Request', errorMessage: 'Unknown field' };
    vi.mocked(sessionsSourceApi.putSetting).mockResolvedValue(failure);

    expect(await saveSessionsSource(DEFAULT_SESSIONS_SOURCE_SETTING)).toEqual(failure);
  });

  test('Should list the analytics entities with the user token', async () => {
    const read = { success: true, response: [{ name: 'sessions' }] };
    vi.mocked(analyticsDataApi.getEntities).mockResolvedValue(read);

    const result = await getSessionsSourceEntities();
    expect(analyticsDataApi.getEntities).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(read);
  });

  test('Should read an entity schema with the user token and cache it', async () => {
    const read = { success: true, response: { fields: [] } };
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue(read);

    expect(await getSessionsSourceSchema('sessions')).toEqual(read);
    expect(await getSessionsSourceSchema('sessions')).toEqual(read);
    expect(analyticsDataApi.getEntitySchema).toHaveBeenCalledOnce();
    expect(analyticsDataApi.getEntitySchema).toHaveBeenCalledWith('sessions', TOKEN_MOCK);
  });

  test('Should not cache a failed entity schema read', async () => {
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({ success: false, status: 500 });

    await getSessionsSourceSchema('sessions');
    await getSessionsSourceSchema('sessions');
    expect(analyticsDataApi.getEntitySchema).toHaveBeenCalledTimes(2);
  });
});
