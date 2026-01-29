'use server';

import { cookies, headers } from 'next/headers';

import { testSuitsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TestSuits } from '@/src/models/evaluation/test-suit';

export async function removeSuit(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitsApi.removeTestSuit(id, token);
}

export async function createSuit(suit: TestSuits) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitsApi.createTestSuit(suit, token);
}

export async function updateTestSuit(suit: TestSuits) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return testSuitsApi.updateTestSuit(suit, token);
}
