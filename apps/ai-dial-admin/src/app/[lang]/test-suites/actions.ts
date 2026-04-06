'use server';

import { cookies, headers } from 'next/headers';

import { testSuitesApi } from '@/src/app/api/api';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { FilterDto, SortDto } from '@/src/models/request';
import type { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { Metric } from '@/src/models/evaluation/metric';

export async function removeTestSuite(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestSuite(id, token);
}

export async function createTestSuite(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestSuite(suite, token);
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
  return testSuitesApi.getTestSuites(page, size, sorts, filters, token);
}

export async function getRuns(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getRuns(page, size, sorts, filters, token);
}

export async function getTestSuite(id: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuite(id, etag, token);
}

export async function importTestCase(
  id: string,
  file: FormData,
  mode: TestCaseImportMode,
  strategy: TestCaseConflictStrategy,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.importTestCase(id, file, token, mode, strategy);
}

export async function importTestCasePreview(id: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.importTestCasePreview(id, file, token);
}

export async function getTestCases(
  id: string | undefined,
  page: number,
  size: number,
  sorts: SortDto[],
  filters: FilterDto[],
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCases(id, page, size, sorts, filters, token);
}

export async function removeTestCase(id: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestCase(id, testCaseId, token);
}

export async function createTestCase(
  testSuiteId: string,
  body: Pick<TestCase, 'testCaseName' | 'data'>,
  includeWarnings?: boolean,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestCase(testSuiteId, body, token, includeWarnings);
}

export async function updateTestCases(id: string, testCases: TestCase[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.updateTestCases(id, testCases, token);
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

export async function getTestSuiteTemplateVariables(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuiteTemplateVariables(id, token);
}

export async function getTestCaseTemplateVariables(id: string, testCaseId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCaseTemplateVariables(id, testCaseId, token);
}

export async function tryOutTestSuite(id: string, requestBody: Record<string, unknown>) {
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
