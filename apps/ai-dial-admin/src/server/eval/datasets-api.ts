import { Token } from '@/src/models/auth';
import { CustomFile, DialFile } from '@/src/models/dial/file';
import {
  Dataset,
  DatasetRequest,
  DatasetVisibilityTransition,
  FileMetadata,
  RevalidationTask,
} from '@/src/models/evaluation/dataset';
import { TestCase, TestCaseBatchPutItem } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';

export const DATASETS_URL = `${API}/datasets`;
export const DATASET_URL = (id: string) => `${DATASETS_URL}/${id}`;
export const DATASET_VISIBILITY_URL = (id: string) => `${DATASET_URL(id)}/visibility`;
export const DATASET_TEST_CASES_URL = (id: string) => `${DATASET_URL(id)}/test-cases`;
export const DATASET_TEST_CASE_URL = (id: string, tcId: string) => `${DATASET_TEST_CASES_URL(id)}/${tcId}`;
export const DATASET_TEST_CASES_IMPORT_URL = (id: string) => `${DATASET_TEST_CASES_URL(id)}/import`;
export const DATASET_TEST_CASES_IMPORT_PREVIEW_URL = (id: string) => `${DATASET_TEST_CASES_URL(id)}/import/preview`;
export const DATASET_TEST_CASES_EXPORT_URL = (id: string) => `${DATASET_TEST_CASES_URL(id)}/export.csv`;
export const DATASET_FILES_URL = (id: string) => `${DATASET_URL(id)}/files`;
export const DATASET_FILE_URL = (id: string, filename: string) => `${DATASET_FILES_URL(id)}/${filename}`;
export const DATASET_REVALIDATION_TASKS_URL = (id: string) => `${DATASET_URL(id)}/revalidation-tasks`;
export const DATASET_REVALIDATION_TASK_URL = (id: string, taskId: string) =>
  `${DATASET_REVALIDATION_TASKS_URL(id)}/${taskId}`;

export interface ListTestCasesOptions {
  includeTotalCount?: boolean;
  includeWarnings?: boolean;
}

export interface BulkDeleteOptions {
  ids?: string[];
  filter?: string;
}

export class DatasetsApi extends BaseApi {
  getDatasets(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
  ): Promise<EvaluationPageData<Dataset> | null> {
    return this.get<EvaluationPageData<Dataset>>(
      `${DATASETS_URL}?page=${page}&size=${size}&includeTotalCount=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getDataset(id: string, etag: string, token: Token): Promise<ServerActionResponse<Dataset>> {
    return this.getActionWithEtag(DATASET_URL(id), etag, token);
  }

  createDataset(req: DatasetRequest, token: Token): Promise<ServerActionResponse<Dataset>> {
    return this.postAction(DATASETS_URL, req, token);
  }

  updateDataset(id: string, req: DatasetRequest, etag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(DATASET_URL(id), req, token, etag);
  }

  removeDataset(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DATASET_URL(id), token);
  }

  patchVisibility(id: string, body: DatasetVisibilityTransition, token: Token): Promise<ServerActionResponse<Dataset>> {
    return this.patchAction(DATASET_VISIBILITY_URL(id), body, token);
  }

  getTestCases(
    datasetId: string,
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
    opts: ListTestCasesOptions = {},
  ): Promise<EvaluationPageData<TestCase> | null> {
    const includeTotal = opts.includeTotalCount ?? true;
    const includeWarnings = opts.includeWarnings ?? true;
    return this.get<EvaluationPageData<TestCase>>(
      `${DATASET_TEST_CASES_URL(datasetId)}?page=${page}&size=${size}` +
        `&includeTotalCount=${includeTotal}&includeWarnings=${includeWarnings}` +
        this.getFiltersAndSortsStr(sorts, filters),
      token,
    );
  }

  getTestCase(datasetId: string, testCaseId: string, token: Token): Promise<TestCase | null> {
    return this.get(DATASET_TEST_CASE_URL(datasetId, testCaseId), token);
  }

  createTestCase(
    datasetId: string,
    body: Pick<TestCase, 'testCaseName' | 'data'>,
    token: Token,
    includeWarnings = false,
  ): Promise<ServerActionResponse> {
    const url = `${DATASET_TEST_CASES_URL(datasetId)}${includeWarnings ? '?includeWarnings=true' : ''}`;
    return this.postAction(url, body, token);
  }

  updateTestCase(
    datasetId: string,
    testCaseId: string,
    body: Pick<TestCase, 'testCaseName' | 'data'>,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.putAction(DATASET_TEST_CASE_URL(datasetId, testCaseId), body, token);
  }

  patchTestCase(
    datasetId: string,
    testCaseId: string,
    mergePatch: Record<string, unknown>,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.patchAction(DATASET_TEST_CASE_URL(datasetId, testCaseId), mergePatch, token);
  }

  removeTestCase(datasetId: string, testCaseId: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DATASET_TEST_CASE_URL(datasetId, testCaseId), token);
  }

  batchPutTestCases(datasetId: string, items: TestCaseBatchPutItem[], token: Token): Promise<ServerActionResponse> {
    return this.putAction(DATASET_TEST_CASES_URL(datasetId), items, token);
  }

  batchPatchTestCases(
    datasetId: string,
    items: Array<{ id: string } & Record<string, unknown>>,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.patchAction(DATASET_TEST_CASES_URL(datasetId), items, token);
  }

  bulkDeleteTestCases(datasetId: string, opts: BulkDeleteOptions, token: Token): Promise<ServerActionResponse> {
    if (opts.ids && opts.ids.length > 0) {
      const filter = `id:in:${opts.ids.map((id) => encodeURIComponent(id)).join(',')}`;
      return this.deleteAction(`${DATASET_TEST_CASES_URL(datasetId)}?filter=${filter}`, token);
    }
    if (opts.filter) {
      return this.deleteAction(`${DATASET_TEST_CASES_URL(datasetId)}?filter=${opts.filter}`, token);
    }
    return this.deleteAction(DATASET_TEST_CASES_URL(datasetId), token);
  }

  importTestCasePreview(datasetId: string, file: FormData, token: Token): Promise<ServerActionResponse> {
    return this.postFiles(DATASET_TEST_CASES_IMPORT_PREVIEW_URL(datasetId), file, token);
  }

  importTestCase(
    datasetId: string,
    file: FormData,
    token: Token,
    mode: TestCaseImportMode,
    strategy: TestCaseConflictStrategy,
  ): Promise<ServerActionResponse> {
    return this.postFiles(
      `${DATASET_TEST_CASES_IMPORT_URL(datasetId)}?importMode=${mode}&conflictStrategy=${strategy}`,
      file,
      token,
    );
  }

  exportTestCasesCsv(datasetId: string, token: Token) {
    const filename = `dataset_${datasetId}_export.csv`;
    return this.streamRequest(DATASET_TEST_CASES_EXPORT_URL(datasetId), filename, token);
  }

  getDatasetFiles(datasetId: string, token: Token): Promise<CustomFile[] | null> {
    return this.get(DATASET_FILES_URL(datasetId), token);
  }

  uploadDatasetFile(
    datasetId: string,
    file: FormData,
    token: Token,
  ): Promise<ServerActionResponse<DialFile[] | FileMetadata>> {
    return this.postFiles(DATASET_FILES_URL(datasetId), file, token);
  }

  removeDatasetFile(datasetId: string, filename: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DATASET_FILE_URL(datasetId, filename), token);
  }

  getRevalidationTasks(
    datasetId: string,
    page: number,
    size: number,
    token: Token,
  ): Promise<EvaluationPageData<RevalidationTask> | null> {
    return this.get(
      `${DATASET_REVALIDATION_TASKS_URL(datasetId)}?page=${page}&size=${size}&includeTotalCount=true`,
      token,
    );
  }

  getRevalidationTask(datasetId: string, taskId: string, token: Token): Promise<RevalidationTask | null> {
    return this.get(DATASET_REVALIDATION_TASK_URL(datasetId, taskId), token);
  }

  private getFiltersAndSortsStr(sorts: SortDto[], filters: FilterDto[]): string {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    return `${filtersStr || sortsStr ? '&' : ''}${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;
  }
}
