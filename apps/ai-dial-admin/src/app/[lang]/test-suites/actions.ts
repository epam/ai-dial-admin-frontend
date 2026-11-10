'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, datasetsApi, runsApi, structuredQueryApi, testSuitesApi } from '@/src/app/api/api';
import {
  buildTestSuitesForDeploymentQuery,
  EVAL_TRENDS_SUITES_PAGE_SIZE,
} from '@/src/components/EntityView/EvalTrends/build-suites-for-deployment-query';
import { collectEvaluationPages } from '@/src/components/ListView/Evaluation/utils/collect-evaluation-pages';
import {
  buildTestSuitesQuery,
  mapTestSuitesQueryResult,
} from '@/src/components/ListView/Evaluation/utils/test-suites-query';
import { DialRouteResource } from '@/src/models/dial/resource';
import { DatasetVisibility } from '@/src/models/evaluation/dataset';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Metric } from '@/src/models/evaluation/metric';
import { DeploymentPeriodCosts, EMPTY_DEPLOYMENT_COSTS } from '@/src/models/evaluation/run';
import { TestSuite, TryOutVariablesByRequest } from '@/src/models/evaluation/test-suite';
import { FilterDto, SortDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeTestSuite(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestSuite(id, token);
}

export async function createTestSuite(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestSuite(suite, token);
}

export async function createTestSuiteWithDataset(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const suiteRes = await testSuitesApi.createTestSuite(suite, token);
  if (!suiteRes.success || !suiteRes.response?.id) return suiteRes;

  const suiteId = suiteRes.response.id;
  await datasetsApi.createDataset(
    { name: `DATASET_${suiteId}`, visibility: DatasetVisibility.PRIVATE, bindToSuiteId: suiteId },
    token,
  );

  return suiteRes;
}

export async function duplicateTestSuite(id: string, suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.duplicateTestSuite(id, suite, token);
}

export async function updateTestSuite(suite: TestSuite, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.updateTestSuite(suite, etag, token);
}

export async function runTestSuite(id?: string, numberOfRuns?: number | string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.runTestSuite(token, id, numberOfRuns);
}

export async function getTestSuites(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const query = buildTestSuitesQuery(page, size, sorts, filters);
  const result = await structuredQueryApi.execute(query, token);
  return mapTestSuitesQueryResult(result, page, size);
}

/** All test suites targeting a deployment or MCP deployment id (entity `name`), name-sorted. */
export async function getTestSuitesForDeployment(deploymentId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  return collectEvaluationPages(async (page) => {
    const result = await structuredQueryApi.execute(
      buildTestSuitesForDeploymentQuery(deploymentId, page, EVAL_TRENDS_SUITES_PAGE_SIZE),
      token,
    );
    return mapTestSuitesQueryResult(result, page, EVAL_TRENDS_SUITES_PAGE_SIZE);
  });
}

/**
 * Eval cost totals for a deployment over the current month-to-date window and the matching
 * previous-month span. A failed GET for a window is treated as no usage for that window so the
 * card can show an em dash (same as a successful empty body).
 */
export async function getDeploymentPeriodCosts(
  deploymentId: string,
  currentFromMs: number,
  currentToMs: number,
  previousFromMs: number,
  previousToMs: number,
): Promise<DeploymentPeriodCosts> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const [current, previous] = await Promise.all([
    runsApi.getDeploymentCosts(deploymentId, currentFromMs, currentToMs, token),
    runsApi.getDeploymentCosts(deploymentId, previousFromMs, previousToMs, token),
  ]);

  return {
    current: current ?? EMPTY_DEPLOYMENT_COSTS,
    previous: previous ?? EMPTY_DEPLOYMENT_COSTS,
  };
}

export async function getTestSuiteByName(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuites(
    0,
    1,
    [],
    [{ column: 'name', value: name, operator: FilterOperatorDto.EQUALS }],
    token,
  );
}

export async function getRuns(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getRuns(page, size, sorts, filters, token);
}

export async function getTestSuite(id: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuite(id, etag, token);
}

export async function getTestCase(id: string, testCaseId?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCase(id, testCaseId, token);
}

export async function getDeployments(type?: DeploymentType, interfaceFilter?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDeployments(token, type, interfaceFilter);
}

export async function getDeploymentTools(deploymentId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDeploymentTools(deploymentId, token);
}

export async function getDeployment(id: string, type: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDeployment(id, type, token);
}

export async function getDeploymentById(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDeploymentById(id, token);
}

export async function getRoutes() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.ROUTE, 'platform/');
}

export async function getRoute(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMerged<DialRouteResource>(token, ResourceType.ROUTE, name);
}

export async function getTestSuiteTemplateVariables(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteTemplateVariables(id, token);
}

export async function getTestCaseTemplateVariables(id: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCaseTemplateVariables(id, testCaseId, token);
}

export async function tryOutTestSuite(id: string, requestBody: TryOutVariablesByRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.tryOutTestSuite(id, requestBody, token);
}

export async function tryOutTestCase(id: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.tryOutTestCase(id, testCaseId, token);
}

export async function getMetricDeclarations(page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getMetricDeclarations(page, size, token);
}

export async function getDetailedMetricDeclarations() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDetailedMetricDeclarations(token);
}

export async function getMetricLatestVersion(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getMetricLatestVersion(id, token);
}

export async function createTestSuiteMetric(id: string, metric: Metric) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestSuiteMetric(id, metric, token);
}

export async function deleteTestSuiteMetric(id: string, metricId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.deleteTestSuiteMetric(id, metricId, token);
}

export async function updateTestSuiteMetric(id: string, metric: Metric) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.updateTestSuiteMetric(id, metric, token);
}

export async function getTestSuiteMetrics(id: string, page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteMetrics(id, page, size, token);
}

export async function getTestSuiteMetricDetails(id: string, metricId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteMetricDetails(id, metricId, token);
}

export async function getTestSuiteMetricDetailsWithSchema(id: string, metricId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteMetricDetailsWithSchema(id, metricId, token);
}

export async function getTestSuiteMetricsAggregated(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteMetricsAggregated(id, token);
}

export async function getTestSuiteFiles(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteFiles(id, token);
}

export async function uploadTestSuiteFiles(id: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.uploadTestSuiteFiles(id, file, token);
}

export async function removeTestSuiteFile(id: string, fileName: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestSuiteFile(id, fileName, token);
}

export async function detachDataset(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.detachDataset(id, token);
}

export async function createDatasetForSuite(suiteId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return datasetsApi.createDataset(
    { name: `DATASET_${suiteId}`, visibility: DatasetVisibility.PRIVATE, bindToSuiteId: suiteId },
    token,
  );
}
