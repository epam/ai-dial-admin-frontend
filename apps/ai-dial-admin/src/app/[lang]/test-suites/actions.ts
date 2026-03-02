'use server';

import { cookies, headers } from 'next/headers';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { FilterDto, SortDto } from '@/src/models/request';

export async function removeTestSuite(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestSuite(id, token);
}

export async function createTestSuite(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestSuite(suite, token);
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

export async function importTestCase(id: string, file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.importTestCase(id, file, token);
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

export async function getDeployments() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getDeployments(token);
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
