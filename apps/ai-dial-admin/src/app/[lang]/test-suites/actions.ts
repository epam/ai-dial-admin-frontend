'use server';

import { cookies, headers } from 'next/headers';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TestSuite } from '@/src/models/evaluation/test-suite';

export async function removeTestSuite(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.removeTestSuite(id, token);
}

export async function createTestSuite(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.createTestSuite(suite, token);
}

export async function updateTestSuite(suite: TestSuite) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.updateTestSuite(suite, token);
}

export async function getTestSuites(page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuites(page, size, token);
}

export async function getTestSuite(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestSuite(id, token);
}

export async function getTestCases(id: string, page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCases(id, page, size, token);
}

export async function getTestCase(id: string, testCaseId?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitesApi.getTestCase(id, testCaseId, token);
}
