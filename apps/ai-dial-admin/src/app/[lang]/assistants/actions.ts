'use server';

import { cookies, headers } from 'next/headers';

import { assistantsApi } from '@/src/app/api/api';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialAssistant } from '@/src/models/dial/assistant';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeAssistant(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assistantsApi.removeAssistant(token, name);
}

export async function createAssistant(assistant: DialAssistant) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assistantsApi.createAssistant({ ...assistant, ...DEFAULT_ROLE_LIMITS }, token);
}

export async function updateAssistant(assistant: DialAssistant) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assistantsApi.updateAssistant(assistant, token);
}
