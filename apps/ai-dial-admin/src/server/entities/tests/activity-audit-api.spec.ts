import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialActivity } from '@/src/models/activity-audit';
import { FilterDto, SortDto } from '@/src/models/request';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { API } from '../../api';
import {
  ACTIVITIES_URL,
  ACTIVITY_AUDIT_ROLLBACK_URL,
  ACTIVITY_AUDIT_URL,
  ActivityAuditApi,
} from '../activity-audit-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ActivityAuditApi', () => {
  const instance = new ActivityAuditApi({ host: TEST_URL });
  const mockActivity: DialActivity = { activityId: '1' } as DialActivity;

  const mockPage = JSON.stringify({ total: 1, items: [mockActivity] });

  const sorts: SortDto[] = [{ column: 'id', direction: SortDirectionDto.ASC }];
  const filters: FilterDto[] = [{ column: 'name', operator: FilterOperatorDto.EQUALS, value: 'Audit Log' }];

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getActivitiesList and sends POST request with correct body and returns response', async () => {
    fetch.mockResponseOnce(mockPage);

    const result = await instance.getActivitiesList(10, 1, TOKEN_MOCK, sorts, filters);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ACTIVITIES_URL),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pageSize: 10, pageNumber: 1, sorts, filters }),
      }),
    );

    expect(result).toEqual(mockPage);
  });

  test('Should calls getActivityById and sends GET request and returns activity', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockActivity));

    const result = await instance.getActivityById('1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${ACTIVITIES_URL}/1`),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(result.response).toEqual(JSON.stringify(mockActivity));
  });

  test('Should calls getRevisionDetails and sends GET request to full URL and returns details', async () => {
    const mockDetails: ActivityAuditEntity = { id: 'rev-1', entityName: 'Adapter' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(mockDetails));

    const result = await instance.getRevisionDetails('/history/revisions/1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${ACTIVITY_AUDIT_URL}/1`),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(result).toEqual(JSON.stringify(mockDetails));
  });

  test('Should calls getRevisions and sends POST request to full URL and returns revisions', async () => {
    const mockDetails: ActivityAuditEntity = { id: 'rev-1', entityName: 'Adapter' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(mockDetails));

    const result = await instance.getRevisions(10, 1, TOKEN_MOCK, sorts, filters);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ACTIVITY_AUDIT_URL),
      expect.objectContaining({ method: 'POST' }),
    );

    expect(result.response).toEqual(JSON.stringify(mockDetails));
  });

  test('Should calls getEntitiesForRevision and sends GET request to full URL and returns entities', async () => {
    const mockDetails: ActivityAuditEntity = { id: 'rev-1', entityName: 'Adapter' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(mockDetails));

    const result = await instance.getEntitiesForRevision('/url', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${API}/url`),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(result).toEqual(JSON.stringify(mockDetails));
  });

  test('Should calls rollbackToRevision and sends POST request', async () => {
    const mockDetails: ActivityAuditEntity = { id: 'rev-1', entityName: 'Adapter' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(mockDetails));

    const result = await instance.rollbackToRevision(5, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ACTIVITY_AUDIT_ROLLBACK_URL}`),
      expect.objectContaining({ method: 'POST' }),
    );

    expect(result).toEqual({ success: true, response: JSON.stringify(mockDetails), etag: undefined });
  });
});
