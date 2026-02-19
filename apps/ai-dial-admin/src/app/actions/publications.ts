'use server';
import { cookies, headers } from 'next/headers';

import { publicationsApi } from '@/src/app/api/api';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function declinePublication(path: string, comment = ''): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.declinePublication(token, path, comment);
}

export async function approvePublication(path: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.approvePublication(token, path);
}

export async function deletePublication(path: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.deletePublication(token, path);
}

export async function updatePublication(publication: FormData): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return publicationsApi.updatePublication(token, publication);
}
