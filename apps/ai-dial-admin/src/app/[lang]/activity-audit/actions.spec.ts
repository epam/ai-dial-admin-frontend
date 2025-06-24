import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getActivities, getEntitiesForRevision, getRevisionDetails, systemRollbackToRevision } from './actions';
import { activityAuditApi } from '@/src/app/api/api';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/api/api', () => ({
  activityAuditApi: {
    getActivitiesList: vi.fn(),
    getRevisionDetails: vi.fn(),
    getEntitiesForRevision: vi.fn(),
    rollbackToRevision: vi.fn(),
  },
}));

vi.mock('@/src/utils/auth/auth-request', () => ({
  getUserToken: vi.fn(),
}));

vi.mock('@/src/utils/env/get-auth-toggle', () => ({
  getIsEnableAuthToggle: vi.fn(),
}));

describe('Activity API Service', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();

    getIsEnableAuthToggle.mockReturnValue(true);
    getUserToken.mockResolvedValue(mockToken);
  });

  describe('getActivities', () => {
    test('should fetch activities with correct params', async () => {
      const pageSize = 10;
      const pageNumber = 2;
      const sorts = [{ field: 'date', direction: 'desc' }];
      const filters = [{ field: 'user', value: 'john' }];
      const mockResponse = { data: 'activities' };

      activityAuditApi.getActivitiesList.mockResolvedValue(mockResponse);

      const result = await getActivities(pageSize, pageNumber, sorts, filters);

      expect(activityAuditApi.getActivitiesList).toHaveBeenCalledWith(pageSize, pageNumber, mockToken, sorts, filters);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRevisionDetails', () => {
    test('should fetch revision details with correct params', async () => {
      const url = '/revisions/123';
      const mockResponse = { data: 'revision' };

      activityAuditApi.getRevisionDetails.mockResolvedValue(mockResponse);

      const result = await getRevisionDetails(url);

      expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith(url, mockToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEntitiesForRevision', () => {
    test('should fetch entities for revision', async () => {
      const url = '/revisions/';
      const mockResponse = { data: 'revision' };

      activityAuditApi.getEntitiesForRevision.mockResolvedValue(mockResponse);

      const result = await getEntitiesForRevision(url, 1);

      expect(activityAuditApi.getEntitiesForRevision).toHaveBeenCalledWith(`${url}1`, mockToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('systemRollbackToRevision', () => {
    test('should call system rollback', async () => {
      const mockResponse = { data: 'revision' };

      activityAuditApi.rollbackToRevision.mockResolvedValue(mockResponse);

      const result = await systemRollbackToRevision(1);

      expect(activityAuditApi.rollbackToRevision).toHaveBeenCalledWith(1, mockToken);
      expect(result).toEqual(mockResponse);
    });
  });
});
