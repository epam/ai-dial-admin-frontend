'use server';
import { ServerActionResponse } from '@/src/models/server-action';
import { publicationsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { cookies, headers } from 'next/headers';

export async function declineFile(path: string, comment: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.declinePublication(token, path, comment);
}

export async function approveFile(path: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.approvePublication(token, path);
}
