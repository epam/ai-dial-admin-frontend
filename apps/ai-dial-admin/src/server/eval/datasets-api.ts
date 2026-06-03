import { IF_MATCH } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { Dataset, DatasetTestCase, DatasetVisibilityTransition } from '@/src/models/evaluation/dataset';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';

export const DATASETS_URL = `${API}/datasets`;
export const DATASET_URL = (id?: string) => `${DATASETS_URL}/${id || ''}`;
export const DATASET_TEST_CASES_URL = (id?: string) => `${DATASET_URL(id)}/test-cases`;
export const DATASET_TEST_CASE_URL = (id?: string, testCaseId?: string) =>
  `${DATASET_TEST_CASES_URL(id)}/${testCaseId || ''}`;
export const DATASET_VISIBILITY_URL = (id: string) => `${DATASET_URL(id)}/visibility`;

export class DatasetsApi extends BaseApi {
  getDatasets(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
  ): Promise<EvaluationPageData<Dataset> | null> {
    const filtersAndSorts = this.getFiltersAndSortsStr(sorts, filters);
    return this.get<EvaluationPageData<Dataset>>(
      `${DATASETS_URL}?page=${page}&size=${size}&includeTotalCount=true&visibility=PUBLIC${filtersAndSorts}`,
      token,
    );
  }

  getDataset(id: string, etag: string, token: Token): Promise<ServerActionResponse<Dataset> | null> {
    return this.getActionWithEtag(DATASET_URL(id), etag, token);
  }

  createDataset(dataset: Dataset, token: Token): Promise<ServerActionResponse> {
    return this.postAction(DATASETS_URL, dataset, token);
  }

  updateDataset(dataset: Dataset, etag: string, token: Token): Promise<ServerActionResponse> {
    return this.putAction(DATASET_URL(dataset.id), dataset, token, { [IF_MATCH]: etag });
  }

  removeDataset(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DATASET_URL(id), token);
  }

  transitionVisibility(id: string, body: DatasetVisibilityTransition, token: Token): Promise<ServerActionResponse> {
    return this.patchAction(DATASET_VISIBILITY_URL(id), body, token);
  }

  getTestCases(
    datasetId: string | undefined,
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
  ): Promise<EvaluationPageData<DatasetTestCase> | null> {
    return this.get<EvaluationPageData<DatasetTestCase>>(
      `${DATASET_TEST_CASES_URL(datasetId)}?page=${page}&size=${size}&includeTotalCount=true&includeWarnings=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  createTestCase(
    datasetId: string,
    body: Pick<DatasetTestCase, 'testCaseName' | 'data'>,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.postAction(DATASET_TEST_CASES_URL(datasetId), body, token);
  }

  updateTestCases(datasetId: string, testCases: DatasetTestCase[], token: Token): Promise<ServerActionResponse> {
    return this.putAction(DATASET_TEST_CASES_URL(datasetId), testCases, token);
  }

  removeTestCase(datasetId: string, testCaseId: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DATASET_TEST_CASE_URL(datasetId, testCaseId), token);
  }

  removeMultipleTestCases(datasetId: string, testCaseNames: string[], token: Token): Promise<ServerActionResponse> {
    const names = testCaseNames.map((name) => `${encodeURIComponent(name)}`).join(',');
    return this.deleteAction(`${DATASET_TEST_CASES_URL(datasetId)}?filter=testCaseName:in:${names}`, token);
  }

  exportTestCasesCsv(datasetId: string, token: Token) {
    const filename = `dataset_${datasetId}_export.csv`;
    return this.streamRequest(`${DATASET_TEST_CASES_URL(datasetId)}/export.csv`, filename, token);
  }

  importTestCasePreview(datasetId: string, file: FormData, token: Token): Promise<ServerActionResponse> {
    return this.postFiles(`${DATASET_TEST_CASES_URL(datasetId)}/import/preview`, file, token);
  }

  importTestCase(
    datasetId: string,
    file: FormData,
    token: Token,
    mode: TestCaseImportMode,
    strategy: TestCaseConflictStrategy,
  ): Promise<ServerActionResponse> {
    return this.postFiles(
      `${DATASET_TEST_CASES_URL(datasetId)}/import?importMode=${mode}&conflictStrategy=${strategy}`,
      file,
      token,
    );
  }

  private getFiltersAndSortsStr(sorts: SortDto[], filters: FilterDto[]): string {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    return `${filtersStr || sortsStr ? '&' : ''}${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;
  }
}
