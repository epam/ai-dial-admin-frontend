import { DialActivity } from '@/src/models/dial/activity-audit';
import { FilterDto, PageDto, SortDto } from '@/src/models/request';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import fetch from 'jest-fetch-mock';
import { ActivityAuditApi } from '../activity-audit-api';

beforeEach(() => {
  fetch.resetMocks();
});

describe('Server :: ActivityAuditApi', () => {
  const instance = new ActivityAuditApi({ host: TEST_URL });
  const mockActivity: DialActivity = { id: '1', name: 'Audit Log' } as DialActivity;

  const mockPage: PageDto<DialActivity> = JSON.stringify({
    total: 1,
    items: [mockActivity],
  });

  const sorts: SortDto[] = [{ field: 'id', direction: 'asc' }];
  const filters: FilterDto[] = [{ column: 'name', operator: 'EQUAL', value: 'Audit Log' }];

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should calls getActivitiesList and sends POST request with correct body and returns response', async () => {
    fetch.mockResponseOnce(mockPage);

    const result = await instance.getActivitiesList(10, 1, TOKEN_MOCK, sorts, filters);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/activities'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pageSize: 10, pageNumber: 1, sorts, filters }),
      }),
    );

    expect(result).toEqual(mockPage);
  });

  it('Should calls getActivityById and sends GET request and returns activity', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockActivity));

    const result = await instance.getActivityById('1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/activities/1'),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(result).toEqual(JSON.stringify(mockActivity));
  });

  it('Should calls getRevisionDetails and sends GET request to full URL and returns details', async () => {
    const mockDetails: ActivityAuditEntity = { id: 'rev-1', entityName: 'Adapter' } as ActivityAuditEntity;
    fetch.mockResponseOnce(JSON.stringify(mockDetails));

    const result = await instance.getRevisionDetails('/history/revisions/1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/history/revisions/1'),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(result).toEqual(JSON.stringify(mockDetails));
  });
});
