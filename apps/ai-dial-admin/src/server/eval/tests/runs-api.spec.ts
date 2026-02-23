import { Run } from '@/src/models/evaluation/run';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { RUNS_URL, RUN_URL, RunsApi } from '../runs-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: RunsApi', () => {
  const instance = new RunsApi({ host: TEST_URL });

  const mockRun: Run = {
    id: 'run-1',
  } as Run;

  const mockPageData = {
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    content: [mockRun],
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call getRuns and return paginated list', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockPageData));

    await instance.getRuns(0, 10, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUNS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getRun by id and return run', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockRun));

    await instance.getRun(mockRun.id, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${RUN_URL(mockRun.id)}`, expect.objectContaining({ method: 'GET' }));
  });
});
