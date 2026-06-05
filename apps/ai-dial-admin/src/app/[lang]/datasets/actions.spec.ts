import { beforeEach, describe, expect, test, vi } from 'vitest';

import { datasetsApi } from '@/src/app/api/api';
import { DatasetVisibility } from '@/src/models/evaluation/dataset';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { FilterOperatorDto } from '@/src/types/request';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createDataset,
  createTestCase,
  exportTestCasesCsv,
  getDataset,
  getDatasetByName,
  getDatasets,
  getTestCases,
  importTestCase,
  importTestCasePreview,
  removeDataset,
  removeMultipleTestCases,
  removeTestCase,
  transitionVisibility,
  updateDataset,
  updateTestCases,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Datasets :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getDatasetByName action', async () => {
    (datasetsApi.getDatasets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getDatasetByName('my-dataset');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.getDatasets).toHaveBeenCalledWith(
      0,
      1,
      [],
      [{ column: 'name', value: 'my-dataset', operator: FilterOperatorDto.EQUALS }],
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getDatasets action', async () => {
    (datasetsApi.getDatasets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getDatasets(0, 10, [], []);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.getDatasets).toHaveBeenCalledWith(0, 10, [], [], TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getDataset action', async () => {
    (datasetsApi.getDataset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getDataset('dataset-1', 'etag');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.getDataset).toHaveBeenCalledWith('dataset-1', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createDataset action', async () => {
    (datasetsApi.createDataset as any).mockResolvedValue(RESPONSE_MOCK);
    const dataset = { name: 'New Dataset', visibility: DatasetVisibility.PUBLIC };

    const result = await createDataset(dataset);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.createDataset).toHaveBeenCalledWith(dataset, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateDataset action', async () => {
    (datasetsApi.updateDataset as any).mockResolvedValue(RESPONSE_MOCK);
    const dataset = { id: 'dataset-1', name: 'Updated' };

    const result = await updateDataset(dataset, 'etag');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.updateDataset).toHaveBeenCalledWith(dataset, 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeDataset action', async () => {
    (datasetsApi.removeDataset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeDataset('dataset-1');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.removeDataset).toHaveBeenCalledWith('dataset-1', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call transitionVisibility action', async () => {
    (datasetsApi.transitionVisibility as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { visibility: DatasetVisibility.PRIVATE };

    const result = await transitionVisibility('dataset-1', body);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.transitionVisibility).toHaveBeenCalledWith('dataset-1', body, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestCases action', async () => {
    (datasetsApi.getTestCases as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getTestCases('dataset-1', 0, 10, [], []);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.getTestCases).toHaveBeenCalledWith('dataset-1', 0, 10, [], [], TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createTestCase action', async () => {
    (datasetsApi.createTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { testCaseName: 'Case 1', data: {} };

    const result = await createTestCase('dataset-1', body);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.createTestCase).toHaveBeenCalledWith('dataset-1', body, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateTestCases action', async () => {
    (datasetsApi.updateTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    const testCases = [{ id: 'tc-1', testCaseName: 'Case 1', data: {} }];

    const result = await updateTestCases('dataset-1', testCases as any);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.updateTestCases).toHaveBeenCalledWith('dataset-1', testCases, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeTestCase action', async () => {
    (datasetsApi.removeTestCase as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeTestCase('dataset-1', 'tc-1');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.removeTestCase).toHaveBeenCalledWith('dataset-1', 'tc-1', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeMultipleTestCases action', async () => {
    (datasetsApi.removeMultipleTestCases as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeMultipleTestCases('dataset-1', ['case-a', 'case-b']);

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.removeMultipleTestCases).toHaveBeenCalledWith('dataset-1', ['case-a', 'case-b'], TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call exportTestCasesCsv action', async () => {
    (datasetsApi.exportTestCasesCsv as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportTestCasesCsv('dataset-1');

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.exportTestCasesCsv).toHaveBeenCalledWith('dataset-1', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importTestCasePreview action', async () => {
    (datasetsApi.importTestCasePreview as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await importTestCasePreview('dataset-1', new FormData());

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.importTestCasePreview).toHaveBeenCalledWith('dataset-1', new FormData(), TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importTestCase action', async () => {
    (datasetsApi.importTestCase as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await importTestCase(
      'dataset-1',
      new FormData(),
      TestCaseImportMode.MERGE,
      TestCaseConflictStrategy.SKIP,
    );

    expect(getUserToken).toHaveBeenCalled();
    expect(datasetsApi.importTestCase).toHaveBeenCalledWith(
      'dataset-1',
      new FormData(),
      TOKEN_MOCK,
      TestCaseImportMode.MERGE,
      TestCaseConflictStrategy.SKIP,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });
});
