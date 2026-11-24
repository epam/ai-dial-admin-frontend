import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsApi, runsApi, structuredQueryApi } from '@/src/app/api/api';
import { QueryMode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { FilterDto } from '@/src/models/request';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { FilterOperatorDto } from '@/src/types/request';
import {
  cancelRun,
  executeStructuredQueries,
  exportRunPreview,
  getRun,
  getRunResults,
  getRuns,
  getHealthDistribution,
  getRunTrends,
  getMetricSnapshots,
  getTestCaseRunResultDetails,
  getTestCaseRunResults,
  removeRun,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const mockPageData = {
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
  content: [{ id: 'run-1' }],
};

describe('Runs :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRuns action and return page data', async () => {
    (runsApi.getRuns as any).mockResolvedValue(mockPageData);

    const result = await getRuns(1, 10, [], []);

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRuns).toHaveBeenCalledWith(1, 10, [], [], TOKEN_MOCK);
    expect(result).toEqual(mockPageData);
  });

  test('Should call getRun action and return run', async () => {
    (runsApi.getRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeRun action and return server action response', async () => {
    (runsApi.removeRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.removeRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call cancelRun action and return server action response on success', async () => {
    (runsApi.cancelRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await cancelRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.cancelRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });

  test('Should call cancelRun action and propagate an error response', async () => {
    const errorResponse = { success: false, errorHeader: 'Error', errorMessage: 'Run already completed' };
    (runsApi.cancelRun as any).mockResolvedValue(errorResponse);

    const result = await cancelRun('run-id');

    expect(result).toEqual(errorResponse);
  });

  test('Should call getRunResults action and return extraction results', async () => {
    const filters: FilterDto[] = [
      { column: 'testSuite', value: 'suite-1', operator: FilterOperatorDto.EQUALS },
      { column: 'status', value: 'PASSED', operator: FilterOperatorDto.EQUALS },
    ];
    const extractionResults = [{ id: 'result-1' }];
    (runsApi.getRunResults as any).mockResolvedValue(extractionResults);

    const result = await getRunResults(filters);

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRunResults).toHaveBeenCalledWith(TOKEN_MOCK, filters);
    expect(result).toEqual(extractionResults);
  });

  test('Should call getTestCaseRunResults action and return analytics results', async () => {
    const filters: FilterDto[] = [
      { column: 'testSuite', value: 'suite-1', operator: FilterOperatorDto.EQUALS },
      { column: 'status', value: 'PASSED', operator: FilterOperatorDto.EQUALS },
    ];
    const analyticsResults = { content: [{ id: 'analytics-1' }] };
    (analyticsApi.getTestCaseRunResults as any).mockResolvedValue(analyticsResults);

    const result = await getTestCaseRunResults(filters);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getTestCaseRunResults).toHaveBeenCalledWith(filters, TOKEN_MOCK);
    expect(result).toEqual(analyticsResults);
  });

  test('Should call getTestCaseRunResultDetails action and return result details', async () => {
    const resultDetail = { id: 'analytics-1' };
    (analyticsApi.getTestCaseRunResultDetails as any).mockResolvedValue(resultDetail);

    const result = await getTestCaseRunResultDetails('analytics-1');

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getTestCaseRunResultDetails).toHaveBeenCalledWith('analytics-1', TOKEN_MOCK);
    expect(result).toEqual(resultDetail);
  });

  test('Should call getRunTrends action with the page, size and token', async () => {
    const page = { content: [{ suiteId: 'suite-1' }], page: 1, size: 10, totalElements: 11, totalPages: 2 };
    (analyticsApi.getRunTrends as any).mockResolvedValue(page);

    const result = await getRunTrends(1, 10);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getRunTrends).toHaveBeenCalledWith(1, 10, TOKEN_MOCK);
    expect(result).toEqual(page);
  });

  test('Should return null from getRunTrends action when the request failed', async () => {
    (analyticsApi.getRunTrends as any).mockResolvedValue(null);

    expect(await getRunTrends(0, 10)).toBeNull();
  });

  test('Should call getHealthDistribution action with the weeks, threshold and token', async () => {
    const distribution = { threshold: 0.75, weeks: [] };
    (analyticsApi.getHealthDistribution as any).mockResolvedValue(distribution);

    const result = await getHealthDistribution(5, 0.75);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getHealthDistribution).toHaveBeenCalledWith(5, 0.75, TOKEN_MOCK);
    expect(result).toEqual(distribution);
  });

  test('Should return null from getHealthDistribution action when the request failed', async () => {
    (analyticsApi.getHealthDistribution as any).mockResolvedValue(null);

    expect(await getHealthDistribution(5, 0.75)).toBeNull();
  });

  test('Should call getMetricSnapshots action and return snapshots', async () => {
    const filters: FilterDto[] = [{ column: 'runId', value: 'run-1', operator: FilterOperatorDto.EQUALS }];
    const snapshots = [{ id: 'snap-1', tsmdName: 'RAGAS Faithfulness' }];
    (analyticsApi.getMetricSnapshots as any).mockResolvedValue(snapshots);

    const result = await getMetricSnapshots(filters);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getMetricSnapshots).toHaveBeenCalledWith(filters, TOKEN_MOCK);
    expect(result).toEqual(snapshots);
  });

  test('Should call exportRunPreview action and return preview data', async () => {
    const preview = [
      ['id', 'prompt'],
      ['run-1', 'hello'],
    ];
    (analyticsApi.exportPreview as any).mockResolvedValue(preview);

    const result = await exportRunPreview('run-1');

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.exportPreview).toHaveBeenCalledWith('run-1', TOKEN_MOCK);
    expect(result).toEqual(preview);
  });
});

describe('Runs :: executeStructuredQueries', () => {
  const queryOf = (entity: string): StructuredQuery => ({ entity, mode: QueryMode.Row });

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should run every query with the user token', async () => {
    (structuredQueryApi.execute as any).mockResolvedValue({ rows: [] });

    await executeStructuredQueries([queryOf('a'), queryOf('b')]);

    expect(structuredQueryApi.execute).toHaveBeenCalledWith(queryOf('a'), TOKEN_MOCK);
    expect(structuredQueryApi.execute).toHaveBeenCalledWith(queryOf('b'), TOKEN_MOCK);
  });

  test('Should return one result per query, in the order of the queries', async () => {
    (structuredQueryApi.execute as any).mockImplementation(async (query: StructuredQuery) => ({
      rows: [{ entity: query.entity }],
    }));

    const results = await executeStructuredQueries([queryOf('first'), queryOf('second')]);

    expect(results).toEqual([{ rows: [{ entity: 'first' }] }, { rows: [{ entity: 'second' }] }]);
  });

  test('Should return null for a query the API reports as failed, and keep the others', async () => {
    (structuredQueryApi.execute as any).mockImplementation(async (query: StructuredQuery) =>
      query.entity === 'bad' ? null : { rows: [] },
    );

    const results = await executeStructuredQueries([queryOf('ok'), queryOf('bad')]);

    expect(results).toEqual([{ rows: [] }, null]);
  });

  test('Should return null for a query that throws instead of rejecting the batch', async () => {
    (structuredQueryApi.execute as any).mockImplementation(async (query: StructuredQuery) => {
      if (query.entity === 'boom') {
        throw new Error('boom');
      }
      return { rows: [] };
    });

    const results = await executeStructuredQueries([queryOf('boom'), queryOf('ok')]);

    expect(results).toEqual([null, { rows: [] }]);
  });

  test('Should return an empty list for an empty batch', async () => {
    expect(await executeStructuredQueries([])).toEqual([]);
  });
});
