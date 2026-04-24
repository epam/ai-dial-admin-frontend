import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsApi, runsApi } from '@/src/app/api/api';
import { FilterDto } from '@/src/models/request';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  getRun,
  getRunResults,
  getRuns,
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

  test('Should call getRunResults action and return extraction results', async () => {
    const filters: FilterDto[] = [
      { column: 'testSuite', value: 'suite-1' },
      { column: 'status', value: 'PASSED' },
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
      { column: 'testSuite', value: 'suite-1' },
      { column: 'status', value: 'PASSED' },
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

  test('Should call getMetricSnapshots action and return snapshots', async () => {
    const filters: FilterDto[] = [{ column: 'runId', value: 'run-1' }];
    const snapshots = [{ id: 'snap-1', tsmdName: 'RAGAS Faithfulness' }];
    (analyticsApi.getMetricSnapshots as any).mockResolvedValue(snapshots);

    const result = await getMetricSnapshots(filters);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsApi.getMetricSnapshots).toHaveBeenCalledWith(filters, TOKEN_MOCK);
    expect(result).toEqual(snapshots);
  });
});
