import { beforeEach, describe, expect, test, vi } from 'vitest';

import { datasetsApi } from '@/src/app/api/api';
import { DatasetVisibility, TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  batchPatchDatasetTestCases,
  batchPutDatasetTestCases,
  bulkDeleteDatasetTestCases,
  createDataset,
  createDatasetFromEntity,
  createDatasetTestCase,
  getDataset,
  getDatasetFiles,
  getDatasetRevalidationTask,
  getDatasetRevalidationTasks,
  getDatasetTestCase,
  getDatasetTestCases,
  getDatasets,
  importDatasetTestCases,
  importDatasetTestCasesPreview,
  patchDatasetTestCase,
  patchDatasetVisibility,
  removeDataset,
  removeDatasetFile,
  removeDatasetTestCase,
  updateDataset,
  updateDatasetTestCase,
  uploadDatasetFile,
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

  test('getDatasets forwards args + token', async () => {
    (datasetsApi.getDatasets as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getDatasets(1, 10, [], []);
    expect(datasetsApi.getDatasets).toHaveBeenCalledWith(1, 10, [], [], TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('getDataset forwards id + etag', async () => {
    (datasetsApi.getDataset as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getDataset('id', 'etag');
    expect(datasetsApi.getDataset).toHaveBeenCalledWith('id', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createDataset forwards request', async () => {
    (datasetsApi.createDataset as any).mockResolvedValue(RESPONSE_MOCK);
    const req = { name: 'd', testCaseSchema: [], visibility: DatasetVisibility.PUBLIC };
    const result = await createDataset(req);
    expect(datasetsApi.createDataset).toHaveBeenCalledWith(req, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createDatasetFromEntity sends PUBLIC dataset with empty schema', async () => {
    (datasetsApi.createDataset as any).mockResolvedValue(RESPONSE_MOCK);
    await createDatasetFromEntity({ name: 'n', description: 'd' });
    expect(datasetsApi.createDataset).toHaveBeenCalledWith(
      { name: 'n', description: 'd', testCaseSchema: [], visibility: DatasetVisibility.PUBLIC },
      TOKEN_MOCK,
    );
  });

  test('updateDataset forwards etag', async () => {
    (datasetsApi.updateDataset as any).mockResolvedValue(RESPONSE_MOCK);
    const req = { name: 'x', testCaseSchema: [] };
    const result = await updateDataset('id', req, 'etag');
    expect(datasetsApi.updateDataset).toHaveBeenCalledWith('id', req, 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('removeDataset', async () => {
    (datasetsApi.removeDataset as any).mockResolvedValue(RESPONSE_MOCK);
    await removeDataset('id');
    expect(datasetsApi.removeDataset).toHaveBeenCalledWith('id', TOKEN_MOCK);
  });

  test('patchDatasetVisibility forwards body', async () => {
    (datasetsApi.patchVisibility as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { visibility: DatasetVisibility.PRIVATE };
    await patchDatasetVisibility('id', body);
    expect(datasetsApi.patchVisibility).toHaveBeenCalledWith('id', body, TOKEN_MOCK);
  });

  test('getDatasetTestCases forwards opts', async () => {
    (datasetsApi.getTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    await getDatasetTestCases('d', 0, 50, [], [], { includeWarnings: true });
    expect(datasetsApi.getTestCases).toHaveBeenCalledWith('d', 0, 50, [], [], TOKEN_MOCK, { includeWarnings: true });
  });

  test('getDatasetTestCase', async () => {
    (datasetsApi.getTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    await getDatasetTestCase('d', 'tc');
    expect(datasetsApi.getTestCase).toHaveBeenCalledWith('d', 'tc', TOKEN_MOCK);
  });

  test('createDatasetTestCase', async () => {
    (datasetsApi.createTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { testCaseName: 'n', data: {} };
    await createDatasetTestCase('d', body, true);
    expect(datasetsApi.createTestCase).toHaveBeenCalledWith('d', body, TOKEN_MOCK, true);
  });

  test('updateDatasetTestCase', async () => {
    (datasetsApi.updateTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { testCaseName: 'n', data: {} };
    await updateDatasetTestCase('d', 'tc', body);
    expect(datasetsApi.updateTestCase).toHaveBeenCalledWith('d', 'tc', body, TOKEN_MOCK);
  });

  test('patchDatasetTestCase', async () => {
    (datasetsApi.patchTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    await patchDatasetTestCase('d', 'tc', { foo: 1 });
    expect(datasetsApi.patchTestCase).toHaveBeenCalledWith('d', 'tc', { foo: 1 }, TOKEN_MOCK);
  });

  test('removeDatasetTestCase', async () => {
    (datasetsApi.removeTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    await removeDatasetTestCase('d', 'tc');
    expect(datasetsApi.removeTestCase).toHaveBeenCalledWith('d', 'tc', TOKEN_MOCK);
  });

  test('batchPutDatasetTestCases', async () => {
    (datasetsApi.batchPutTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    const items = [{ id: '1', testCaseName: 'n', data: {} }];
    await batchPutDatasetTestCases('d', items);
    expect(datasetsApi.batchPutTestCases).toHaveBeenCalledWith('d', items, TOKEN_MOCK);
  });

  test('batchPatchDatasetTestCases', async () => {
    (datasetsApi.batchPatchTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    const items = [{ id: '1', enabled: true }];
    await batchPatchDatasetTestCases('d', items);
    expect(datasetsApi.batchPatchTestCases).toHaveBeenCalledWith('d', items, TOKEN_MOCK);
  });

  test('bulkDeleteDatasetTestCases', async () => {
    (datasetsApi.bulkDeleteTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    await bulkDeleteDatasetTestCases('d', { ids: ['a', 'b'] });
    expect(datasetsApi.bulkDeleteTestCases).toHaveBeenCalledWith('d', { ids: ['a', 'b'] }, TOKEN_MOCK);
  });

  test('importDatasetTestCases', async () => {
    (datasetsApi.importTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const fd = new FormData();
    await importDatasetTestCases('d', fd, TestCaseImportMode.OVERRIDE, TestCaseConflictStrategy.FAIL);
    expect(datasetsApi.importTestCase).toHaveBeenCalledWith(
      'd',
      fd,
      TOKEN_MOCK,
      TestCaseImportMode.OVERRIDE,
      TestCaseConflictStrategy.FAIL,
    );
  });

  test('importDatasetTestCasesPreview', async () => {
    (datasetsApi.importTestCasePreview as any).mockResolvedValue(RESPONSE_MOCK);
    const fd = new FormData();
    await importDatasetTestCasesPreview('d', fd);
    expect(datasetsApi.importTestCasePreview).toHaveBeenCalledWith('d', fd, TOKEN_MOCK);
  });

  test('getDatasetFiles', async () => {
    (datasetsApi.getDatasetFiles as any).mockResolvedValue(RESPONSE_MOCK);
    await getDatasetFiles('d');
    expect(datasetsApi.getDatasetFiles).toHaveBeenCalledWith('d', TOKEN_MOCK);
  });

  test('uploadDatasetFile', async () => {
    (datasetsApi.uploadDatasetFile as any).mockResolvedValue(RESPONSE_MOCK);
    const fd = new FormData();
    await uploadDatasetFile('d', fd);
    expect(datasetsApi.uploadDatasetFile).toHaveBeenCalledWith('d', fd, TOKEN_MOCK);
  });

  test('removeDatasetFile', async () => {
    (datasetsApi.removeDatasetFile as any).mockResolvedValue(RESPONSE_MOCK);
    await removeDatasetFile('d', 'file.txt');
    expect(datasetsApi.removeDatasetFile).toHaveBeenCalledWith('d', 'file.txt', TOKEN_MOCK);
  });

  test('getDatasetRevalidationTasks', async () => {
    (datasetsApi.getRevalidationTasks as any).mockResolvedValue(RESPONSE_MOCK);
    await getDatasetRevalidationTasks('d', 0, 10);
    expect(datasetsApi.getRevalidationTasks).toHaveBeenCalledWith('d', 0, 10, TOKEN_MOCK);
  });

  test('getDatasetRevalidationTask', async () => {
    (datasetsApi.getRevalidationTask as any).mockResolvedValue(RESPONSE_MOCK);
    await getDatasetRevalidationTask('d', 't');
    expect(datasetsApi.getRevalidationTask).toHaveBeenCalledWith('d', 't', TOKEN_MOCK);
  });
});
