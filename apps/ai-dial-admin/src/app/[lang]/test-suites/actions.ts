'use server';

import { cookies, headers } from 'next/headers';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TestSuite } from '@/src/models/evaluation/test-suite';
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
