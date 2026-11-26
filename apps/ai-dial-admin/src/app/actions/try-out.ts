'use server';

import { cookies, headers } from 'next/headers';

import { coreUtilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * The interfaces Core reports for a deployment, read with the signed-in admin's token. `null` when they could not
 * be read, whether the deployment is missing, hidden from the admin or Core did not answer.
 */
export async function getTryOutInterfaces(deploymentName: string): Promise<string[] | null> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const deployment = await coreUtilityApi.checkDeploymentByName(deploymentName, token);

  return deployment?.interfaces ?? null;
}
