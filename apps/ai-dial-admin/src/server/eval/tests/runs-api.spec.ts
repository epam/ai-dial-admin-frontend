import { Run } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { RUN_RESULTS_URL, RUNS_URL, RUN_URL, RunsApi } from '../runs-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: RunsApi', () => {
  const instance = new RunsApi({ host: TEST_URL });

  const mockRun: Run = {
    id: 'run-1',
  } as Run;

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call getRuns and return paginated list', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getRuns(0, 10, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUNS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getRuns with different page and size', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getRuns(2, 25, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUNS_URL}?page=2&size=25&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getRun by id and return run', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const runId = mockRun.id as string;
    await instance.getRun(runId, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${RUN_URL(runId)}`, expect.objectContaining({ method: 'GET' }));
  });

  test('Should call removeRun with DELETE method and return response', async () => {
    const successResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(successResponse));

    const runId = mockRun.id as string;
    const result = await instance.removeRun(runId, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${RUN_URL(runId)}`, expect.objectContaining({ method: 'DELETE' }));
    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  test('Should call getRunResults with filters and return extraction results', async () => {
    fetch.mockResponseOnce(JSON.stringify([RESPONSE_MOCK]));

    const filters: FilterDto[] = [
      { column: 'status', operator: FilterOperatorDto.EQUALS, value: 'PASSED' },
      { column: 'name', operator: FilterOperatorDto.CONTAINS, value: 'smoke test' },
    ];

    await instance.getRunResults(TOKEN_MOCK, filters);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RUN_RESULTS_URL}?size=1000&filter=status:eq:PASSED&filter=name:co:smoke%20test`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
