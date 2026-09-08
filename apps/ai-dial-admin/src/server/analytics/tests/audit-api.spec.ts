import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialActivity } from '@/src/models/activity-audit';
import { AuditPageData, FilterDto, SortDto } from '@/src/models/request';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';
import { ANALYTICS_ACTIVITIES_URL, AnalyticsAuditApi } from '@/src/server/analytics/audit-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: AnalyticsAuditApi', () => {
  const instance = new AnalyticsAuditApi({ host: TEST_URL });

  const activity = { activityId: 'abc-123', resourceType: 'TableColumn', resourceId: 'orders:total' } as DialActivity;
  const page: AuditPageData<DialActivity> = { total: 1, totalPages: 1, data: [activity] };

  const sorts: SortDto[] = [{ column: 'epochTimestampMs', direction: SortDirectionDto.DESC }];
  const filters: FilterDto[] = [{ column: 'resourceType', operator: FilterOperatorDto.EQUALS, value: 'Table' }];

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getActivitiesList issues POST v1/activities with the paging, sort and filter body', async () => {
    fetch.mockResponseOnce(JSON.stringify(page), JSON_HEADERS);

    await instance.getActivitiesList(25, 0, TOKEN_MOCK, sorts, filters);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ANALYTICS_ACTIVITIES_URL}`),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pageSize: 25, pageNumber: 0, sorts, filters }),
      }),
    );
  });

  test('getActivitiesList returns the parsed total, totalPages and data envelope', async () => {
    fetch.mockResponseOnce(JSON.stringify(page), JSON_HEADERS);

    const res = await instance.getActivitiesList(25, 0, TOKEN_MOCK, sorts, filters);

    expect(res).toEqual(page);
  });

  test('getActivitiesList carries an incremented page number for a subsequent block', async () => {
    fetch.mockResponseOnce(JSON.stringify({ total: 60, totalPages: 3, data: [activity] }), JSON_HEADERS);

    await instance.getActivitiesList(25, 1, TOKEN_MOCK, sorts, filters);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ANALYTICS_ACTIVITIES_URL}`),
      expect.objectContaining({
        body: JSON.stringify({ pageSize: 25, pageNumber: 1, sorts, filters }),
      }),
    );
  });

  test('getActivitiesList returns null when the backend fails', async () => {
    fetch.mockResponseOnce('', { status: 500 });

    const res = await instance.getActivitiesList(25, 0, TOKEN_MOCK, sorts, filters);

    expect(res).toBeNull();
  });

  test('getActivityById issues GET v1/activities/{id} and returns the activity', async () => {
    fetch.mockResponseOnce(JSON.stringify(activity), JSON_HEADERS);

    const res = await instance.getActivityById('abc-123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ANALYTICS_ACTIVITIES_URL}/abc-123`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(res.response).toEqual(activity);
  });

  test('getActivityById reports the failure rather than throwing when the activity is unknown', async () => {
    fetch.mockResponseOnce('', { status: 404 });

    const res = await instance.getActivityById('missing', TOKEN_MOCK);

    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });

  // The service omits `initiatedEmail` and `parentActivityId` on a table-level activity, so the
  // envelope must survive a partial `DialActivity` — the resolver treats a falsy `response` as
  // "this backend does not own the activity" and moves on.
  test('getActivityById returns the activity for a payload that carries no email or parent id', async () => {
    const bare = {
      activityId: 'abc-123',
      activityType: 'Update',
      resourceType: 'Table',
      resourceId: 'orders',
      epochTimestampMs: 1_700_000_000_000,
      initiatedAuthor: 'unknown',
      revision: 37,
    };
    fetch.mockResponseOnce(JSON.stringify(bare), JSON_HEADERS);

    const res = await instance.getActivityById('abc-123', TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(res.response).toEqual(bare);
  });

  // An unreachable or unconfigured host does not answer `404` — it rejects. Pinned here because the
  // detail-page resolver's fallback chain has to isolate that per backend, and this is the contract
  // it isolates.
  test('getActivityById rejects when the upstream cannot be reached', async () => {
    fetch.mockRejectOnce(new TypeError('fetch failed'));

    await expect(instance.getActivityById('abc-123', TOKEN_MOCK)).rejects.toThrow('fetch failed');
  });

  test('getRevisionDetails prefixes the revision route with the analytics v1 segment', async () => {
    const snapshot = { name: 'orders' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(snapshot), JSON_HEADERS);

    const res = await instance.getRevisionDetails('/tables/orders/revision/7', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/orders/revision/7'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(res).toEqual(snapshot);
  });

  test('getRevisionDetails returns null for a snapshot the backend answers as absent', async () => {
    fetch.mockResponseOnce('', { status: 404 });

    const res = await instance.getRevisionDetails('/tables/orders/revision/1', TOKEN_MOCK);

    expect(res).toBeNull();
  });

  test('getRevisionDetails rejects when the upstream cannot be reached', async () => {
    fetch.mockRejectOnce(new TypeError('fetch failed'));

    await expect(instance.getRevisionDetails('/tables/orders/revision/7', TOKEN_MOCK)).rejects.toThrow('fetch failed');
  });
});
