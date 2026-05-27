import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DatasetVisibility, TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

import {
  DATASETS_URL,
  DATASET_FILES_URL,
  DATASET_FILE_URL,
  DATASET_REVALIDATION_TASKS_URL,
  DATASET_REVALIDATION_TASK_URL,
  DATASET_TEST_CASES_IMPORT_PREVIEW_URL,
  DATASET_TEST_CASES_IMPORT_URL,
  DATASET_TEST_CASES_URL,
  DATASET_TEST_CASE_URL,
  DATASET_URL,
  DATASET_VISIBILITY_URL,
  DatasetsApi,
} from '../datasets-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: DatasetsApi', () => {
  const instance = new DatasetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getDatasets builds URL with paging + total count', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getDatasets(0, 10, [], [], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASETS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getDataset sends GET with etag', async () => {
    fetch.mockResponseOnce(JSON.stringify({ id: 'd' }));
    await instance.getDataset('d', 'etag', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL('d')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('createDataset POSTs to /datasets', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.createDataset({ name: 'n', testCaseSchema: [], visibility: DatasetVisibility.PUBLIC }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASETS_URL}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('updateDataset PUTs with If-Match', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateDataset('d', { name: 'n', testCaseSchema: [] }, 'etag', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL('d')}`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  test('removeDataset DELETEs by id', async () => {
    fetch.mockResponseOnce('');
    await instance.removeDataset('d', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL('d')}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('patchVisibility PATCHes visibility URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.patchVisibility('d', { visibility: DatasetVisibility.PRIVATE }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_VISIBILITY_URL('d')}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  test('getTestCases includes warnings + total count by default', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [] }));
    await instance.getTestCases('d', 0, 50, [], [], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('d')}?page=0&size=50&includeTotalCount=true&includeWarnings=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('createTestCase appends includeWarnings query param when requested', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.createTestCase('d', { testCaseName: 'n', data: {} }, TOKEN_MOCK, true);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('d')}?includeWarnings=true`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('updateTestCase PUTs to per-case URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.updateTestCase('d', 'tc', { testCaseName: 'n', data: {} }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASE_URL('d', 'tc')}`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  test('patchTestCase PATCHes per-case URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.patchTestCase('d', 'tc', { foo: 1 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASE_URL('d', 'tc')}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  test('removeTestCase DELETEs per-case URL', async () => {
    fetch.mockResponseOnce('');
    await instance.removeTestCase('d', 'tc', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASE_URL('d', 'tc')}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('batchPutTestCases PUTs to bulk URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.batchPutTestCases('d', [{ id: '1', testCaseName: 'n', data: {} }], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('d')}`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  test('batchPatchTestCases PATCHes bulk URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.batchPatchTestCases('d', [{ id: '1', enabled: true }], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('d')}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  test('bulkDeleteTestCases by ids builds filter id:in:', async () => {
    fetch.mockResponseOnce('');
    await instance.bulkDeleteTestCases('d', { ids: ['a', 'b'] }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('d')}?filter=id:in:a,b`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('importTestCase POSTs to import URL with mode and strategy', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.importTestCase(
      'd',
      new FormData(),
      TOKEN_MOCK,
      TestCaseImportMode.OVERRIDE,
      TestCaseConflictStrategy.FAIL,
    );
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_IMPORT_URL('d')}?importMode=OVERRIDE&conflictStrategy=FAIL`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('importTestCasePreview POSTs to preview URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.importTestCasePreview('d', new FormData(), TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_IMPORT_PREVIEW_URL('d')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('getDatasetFiles GETs files URL', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getDatasetFiles('d', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_FILES_URL('d')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('uploadDatasetFile POSTs to files URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.uploadDatasetFile('d', new FormData(), TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_FILES_URL('d')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('removeDatasetFile DELETEs file URL', async () => {
    fetch.mockResponseOnce('');
    await instance.removeDatasetFile('d', 'a.csv', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_FILE_URL('d', 'a.csv')}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('getRevalidationTasks GETs paged list URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [] }));
    await instance.getRevalidationTasks('d', 0, 10, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_REVALIDATION_TASKS_URL('d')}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getRevalidationTask GETs single task URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.getRevalidationTask('d', 't', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_REVALIDATION_TASK_URL('d', 't')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
