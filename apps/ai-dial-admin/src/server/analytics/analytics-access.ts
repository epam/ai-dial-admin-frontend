import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function isAnalyticsForbidden(): Promise<boolean> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const access = await analyticsDataApi.checkAccess(token);

  return !access.success && access.status === 403;
}
