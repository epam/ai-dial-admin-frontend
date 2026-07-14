'use server';

import { cookies, headers } from 'next/headers';

import { datasetsApi } from '@/src/app/api/api';
import {
  Dataset,
  DatasetPublishBody,
  DatasetTestCase,
  DatasetVisibilityTransition,
} from '@/src/models/evaluation/dataset';
import { FilterDto, SortDto } from '@/src/models/request';
import type { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { FilterOperatorDto } from '@/src/types/request';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getDatasetByName(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDatasets(
    0,
    1,
    [],
    [{ column: 'name', value: name, operator: FilterOperatorDto.EQUALS }],
    token,
  );
}

export async function getDatasets(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDatasets(page, size, sorts, filters, token);
}

export async function getDataset(id: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDataset(id, etag, token);
}

export async function createDataset(dataset: Dataset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createDataset(dataset, token);
}

export async function cloneDataset(id: string, body: Pick<Dataset, 'name' | 'description'>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.cloneDataset(id, body, token);
}

export async function updateDataset(dataset: Dataset, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.updateDataset(dataset, etag, token);
}

export async function removeDataset(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeDataset(id, token);
}

export async function getDatasetTestSuites(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDatasetTestSuites(id, token);
}

export async function transitionVisibility(id: string, body: DatasetVisibilityTransition) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.transitionVisibility(id, body, token);
}

export async function getTestCases(
  id: string | undefined,
  page: number,
  size: number,
  sorts: SortDto[],
  filters: FilterDto[],
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getTestCases(id, page, size, sorts, filters, token);
}

export async function createTestCase(
  datasetId: string,
  body: Pick<DatasetTestCase, 'testCaseName' | 'data' | 'conversationId' | 'turnIndex'>,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createTestCase(datasetId, body, token);
}

export async function updateTestCases(datasetId: string, testCases: DatasetTestCase[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.updateTestCases(datasetId, testCases, token);
}

export async function removeTestCase(datasetId: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeTestCase(datasetId, testCaseId, token);
}

export async function removeMultipleTestCases(datasetId: string, testCaseNames: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeMultipleTestCases(datasetId, testCaseNames, token);
}

export async function exportTestCasesCsv(datasetId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.exportTestCasesCsv(datasetId, token);
}

export async function importTestCasePreview(datasetId: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.importTestCasePreview(datasetId, file, token);
}

export async function importTestCase(
  datasetId: string,
  file: FormData,
  mode: TestCaseImportMode,
  strategy: TestCaseConflictStrategy,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.importTestCase(datasetId, file, token, mode, strategy);
}

export async function publishDataset(id: string, body: DatasetPublishBody) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.publishDataset(id, body, token);
}
