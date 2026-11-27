'use server';

import { cookies, headers } from 'next/headers';

import { coreUtilityApi } from '@/src/app/api/api';
import { TryOutFailureKind, TryOutInterfacesResult } from '@/src/components/TryOut/Deployment/models';
import { classifyTryOutFailure } from '@/src/components/TryOut/Deployment/utils/classify-failure';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * The interfaces Core reports for a deployment, read with the signed-in admin's token. When they cannot be read the
 * result says why, sorted the way a failed Try out request is: no access, not found, or Core failing or unreachable.
 */
export async function getTryOutInterfaces(deploymentName: string): Promise<TryOutInterfacesResult> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  try {
    const result = await coreUtilityApi.getDeploymentInfoResult(deploymentName, token);
    if (result.success) {
      return { interfaces: result.response?.interfaces ?? [] };
    }

    return {
      failure: result.status ? classifyTryOutFailure(result.status, false) : { kind: TryOutFailureKind.Network },
    };
  } catch {
    return { failure: { kind: TryOutFailureKind.Network } };
  }
}
