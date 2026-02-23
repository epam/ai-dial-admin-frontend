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

    const result = await instance.getRuns(0, 10, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUNS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(mockPageData);
  });

  test('Should call getRuns with different page and size', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockPageData));

    const result = await instance.getRuns(2, 25, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUNS_URL}?page=2&size=25&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(mockPageData);
  });

  test('Should call getRun by id and return run', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockRun));

    const runId = mockRun.id as string;
    const result = await instance.getRun(runId, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${RUN_URL(runId)}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(mockRun);
  });

  test('Should call removeRun with DELETE method and return response', async () => {
    const successResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(successResponse));

    const runId = mockRun.id as string;
    const result = await instance.removeRun(runId, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${RUN_URL(runId)}`, expect.objectContaining({ method: 'DELETE' }));
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });
});
