'use server';

import { cookies, headers } from 'next/headers';

import { datasetsApi } from '@/src/app/api/api';
import { BulkDeleteOptions, ListTestCasesOptions } from '@/src/server/eval/datasets-api';
import { DatasetRequest, DatasetVisibilityTransition } from '@/src/models/evaluation/dataset';
import { TestCase, TestCaseBatchPutItem } from '@/src/models/evaluation/test-suite';
import { FilterDto, SortDto } from '@/src/models/request';
import { DatasetVisibility, TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getDatasets(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDatasets(page, size, sorts, filters, token);
}

export async function getDataset(id: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDataset(id, etag, token);
}

export async function createDataset(req: DatasetRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createDataset(req, token);
}

// Adapter for EvaluationListView, which passes an entity-shaped object from its
// generic create flow. We accept the partial entity (only name/description are
// captured in the generic list-page Create modal) and POST a PUBLIC dataset.
export async function createDatasetFromEntity(entity: { name?: string; description?: string }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createDataset(
    {
      name: entity.name ?? '',
      description: entity.description,
      testCaseSchema: [],
      visibility: DatasetVisibility.PUBLIC,
    },
    token,
  );
}

export async function updateDataset(id: string, req: DatasetRequest, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.updateDataset(id, req, etag, token);
}

export async function removeDataset(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeDataset(id, token);
}

export async function patchDatasetVisibility(id: string, body: DatasetVisibilityTransition) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.patchVisibility(id, body, token);
}

export async function getDatasetTestCases(
  datasetId: string,
  page: number,
  size: number,
  sorts: SortDto[],
  filters: FilterDto[],
  opts?: ListTestCasesOptions,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getTestCases(datasetId, page, size, sorts, filters, token, opts);
}

export async function getDatasetTestCase(datasetId: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getTestCase(datasetId, testCaseId, token);
}

export async function createDatasetTestCase(
  datasetId: string,
  body: Pick<TestCase, 'testCaseName' | 'data'>,
  includeWarnings?: boolean,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createTestCase(datasetId, body, token, includeWarnings);
}

export async function updateDatasetTestCase(
  datasetId: string,
  testCaseId: string,
  body: Pick<TestCase, 'testCaseName' | 'data'>,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.updateTestCase(datasetId, testCaseId, body, token);
}

export async function patchDatasetTestCase(datasetId: string, testCaseId: string, mergePatch: Record<string, unknown>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.patchTestCase(datasetId, testCaseId, mergePatch, token);
}

export async function removeDatasetTestCase(datasetId: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeTestCase(datasetId, testCaseId, token);
}

export async function batchPutDatasetTestCases(datasetId: string, items: TestCaseBatchPutItem[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.batchPutTestCases(datasetId, items, token);
}

export async function batchPatchDatasetTestCases(
  datasetId: string,
  items: Array<{ id: string } & Record<string, unknown>>,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.batchPatchTestCases(datasetId, items, token);
}

export async function bulkDeleteDatasetTestCases(datasetId: string, opts: BulkDeleteOptions) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.bulkDeleteTestCases(datasetId, opts, token);
}

export async function importDatasetTestCases(
  datasetId: string,
  file: FormData,
  mode: TestCaseImportMode,
  strategy: TestCaseConflictStrategy,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.importTestCase(datasetId, file, token, mode, strategy);
}

export async function importDatasetTestCasesPreview(datasetId: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.importTestCasePreview(datasetId, file, token);
}

export async function getDatasetFiles(datasetId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getDatasetFiles(datasetId, token);
}

export async function uploadDatasetFile(datasetId: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.uploadDatasetFile(datasetId, file, token);
}

export async function removeDatasetFile(datasetId: string, filename: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.removeDatasetFile(datasetId, filename, token);
}

export async function getDatasetRevalidationTasks(datasetId: string, page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getRevalidationTasks(datasetId, page, size, token);
}

export async function getDatasetRevalidationTask(datasetId: string, taskId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.getRevalidationTask(datasetId, taskId, token);
}
