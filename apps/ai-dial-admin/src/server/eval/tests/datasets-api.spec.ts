import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  DATASET_PUBLISH_URL,
  DATASET_TEST_CASES_URL,
  DATASET_TEST_CASE_URL,
  DATASET_TEST_SUITES_URL,
  DATASET_URL,
  DATASET_VISIBILITY_URL,
  DATASETS_URL,
  DatasetsApi,
} from '../datasets-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: DatasetsApi', () => {
  const instance = new DatasetsApi({ host: TEST_URL });

  const mockDataset: Dataset = {
    id: 'dataset-1',
    name: 'My Dataset',
    description: 'Test dataset',
    visibility: DatasetVisibility.PUBLIC,
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call getDatasets with visibility=PUBLIC query param', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [mockDataset], totalElements: 1 }));

    await instance.getDatasets(0, 10, [], [], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASETS_URL}?page=0&size=10&includeTotalCount=true&visibility=PUBLIC`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getDataset by id', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockDataset));

    await instance.getDataset(mockDataset.id as string, 'etag', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL(mockDataset.id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call createDataset with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createDataset(mockDataset, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASETS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockDataset),
      }),
    );
  });

  test('Should call updateDataset with correct payload and etag', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateDataset(mockDataset, 'etag-value', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL(mockDataset.id)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockDataset),
      }),
    );
  });

  test('Should call removeDataset with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeDataset(mockDataset.id as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_URL(mockDataset.id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call getDatasetTestSuites with GET method', async () => {
    const mockTestSuites = [
      { id: 'ts-1', name: 'Suite 1' },
      { id: 'ts-2', name: 'Suite 2' },
    ];
    fetch.mockResponseOnce(JSON.stringify(mockTestSuites));

    await instance.getDatasetTestSuites(mockDataset.id as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_SUITES_URL(mockDataset.id as string)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call transitionVisibility with PATCH method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const body = { visibility: DatasetVisibility.PRIVATE };

    await instance.transitionVisibility(mockDataset.id as string, body, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_VISIBILITY_URL(mockDataset.id as string)}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    );
  });

  test('Should call getTestCases with pagination params', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [], totalElements: 0 }));

    await instance.getTestCases('dataset-1', 0, 10, [], [], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}?page=0&size=10&includeTotalCount=true&includeWarnings=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call createTestCase with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const body = { testCaseName: 'Case 1', data: { input: 'hello' } };

    await instance.createTestCase('dataset-1', body, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });

  test('Should call updateTestCases with PUT method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const testCases = [{ id: 'tc-1', testCaseName: 'Case 1', data: {} }];

    await instance.updateTestCases('dataset-1', testCases, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(testCases),
      }),
    );
  });

  test('Should call removeTestCase with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeTestCase('dataset-1', 'tc-1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASE_URL('dataset-1', 'tc-1')}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call removeMultipleTestCases with filter query param', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeMultipleTestCases('dataset-1', ['case-a', 'case-b'], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}?filter=testCaseName:in:case-a,case-b`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call exportTestCasesCsv via streamRequest', async () => {
    const streamResponse = new Response(null, { status: 200 });
    const streamSpy = vi.spyOn(instance as any, 'streamRequest').mockResolvedValue(streamResponse);

    const result = await instance.exportTestCasesCsv('dataset-1', TOKEN_MOCK);

    expect(streamSpy).toHaveBeenCalledWith(
      `${DATASET_TEST_CASES_URL('dataset-1')}/export.csv`,
      'dataset_dataset-1_export.csv',
      TOKEN_MOCK,
    );
    expect(result).toBe(streamResponse);
  });

  test('Should call importTestCasePreview with POST method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.importTestCasePreview('dataset-1', new FormData(), TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}/import/preview`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call publishDataset with POST method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const body = { name: 'Published Dataset', description: 'A public version' };

    await instance.publishDataset(mockDataset.id as string, body, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_PUBLISH_URL(mockDataset.id as string)}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });

  test('Should call importTestCase with mode and strategy query params', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.importTestCase(
      'dataset-1',
      new FormData(),
      TOKEN_MOCK,
      TestCaseImportMode.OVERRIDE,
      TestCaseConflictStrategy.FAIL,
    );

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DATASET_TEST_CASES_URL('dataset-1')}/import?importMode=OVERRIDE&conflictStrategy=FAIL`,
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
