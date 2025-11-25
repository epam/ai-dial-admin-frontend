import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import {
  getActivities,
  getEntitiesForRevision,
  getRevisionDetails,
  getRevisions,
  systemRollbackToRevision,
  getActivityById,
} from './actions';
import { activityAuditApi } from '@/src/app/api/api';
import { TOKEN_MOCK, RESPONSE_MOCK } from '@/src/utils/tests/mock/api.mock';
import { FilterDto, SortDto } from '@/src/models/request';
import { SortDirectionDto } from '@/src/types/request';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Activity audit :: server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getActivitiesList action', async () => {
    (activityAuditApi.getActivitiesList as any).mockResolvedValue(RESPONSE_MOCK);

    const pageSize = 10;
    const pageNumber = 2;
    const sorts = [{ column: 'date', direction: SortDirectionDto.DESC }] as SortDto[];
    const filters = [{ column: 'user', value: 'john' }] as FilterDto[];

    const result = await getActivities(pageSize, pageNumber, sorts, filters);

    expect(activityAuditApi.getActivitiesList).toHaveBeenCalledWith(pageSize, pageNumber, TOKEN_MOCK, sorts, filters);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call getRevisionDetails action', async () => {
    (activityAuditApi.getRevisionDetails as any).mockResolvedValue(RESPONSE_MOCK);
    const url = '/revisions/123';
    const result = await getRevisionDetails(url);

    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith(url, TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call getEntitiesForRevision action', async () => {
    (activityAuditApi.getActivityById as any).mockResolvedValue(RESPONSE_MOCK);
    const url = '/revisions/';
    await getEntitiesForRevision(url, 1);

    expect(activityAuditApi.getEntitiesForRevision).toHaveBeenCalledWith(`${url}1`, TOKEN_MOCK);
  });

  test('Should call getRevisions action', async () => {
    (activityAuditApi.getRevisions as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRevisions(1, 1, [], []);

    expect(activityAuditApi.getRevisions).toHaveBeenCalledWith(1, 1, TOKEN_MOCK, [], []);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call systemRollbackToRevision action', async () => {
    (activityAuditApi.rollbackToRevision as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await systemRollbackToRevision(1);

    expect(activityAuditApi.rollbackToRevision).toHaveBeenCalledWith(1, TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call getActivityById action', async () => {
    (activityAuditApi.getActivityById as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getActivityById('id');

    expect(activityAuditApi.getActivityById).toHaveBeenCalledWith('id', TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });
});
