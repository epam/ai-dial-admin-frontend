import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getActivities, getRevisionDetails } from './actions';
import { activityAuditApi } from '@/src/app/api/api';

jest.mock('@/src/app/api/api', () => ({
  activityAuditApi: {
    getActivitiesList: jest.fn(),
    getRevisionDetails: jest.fn(),
  },
}));

jest.mock('@/src/utils/auth/auth-request', () => ({
  getUserToken: jest.fn(),
}));

jest.mock('@/src/utils/env/get-auth-toggle', () => ({
  getIsEnableAuthToggle: jest.fn(),
}));

describe('Activity API Service', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();

    getIsEnableAuthToggle.mockReturnValue(true);
    getUserToken.mockResolvedValue(mockToken);
  });

  describe('getActivities', () => {
    it('should fetch activities with correct params', async () => {
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
    it('should fetch revision details with correct params', async () => {
      const url = '/revisions/123';
      const mockResponse = { data: 'revision' };

      activityAuditApi.getRevisionDetails.mockResolvedValue(mockResponse);

      const result = await getRevisionDetails(url);

      expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith(url, mockToken);
      expect(result).toEqual(mockResponse);
    });
  });
});
