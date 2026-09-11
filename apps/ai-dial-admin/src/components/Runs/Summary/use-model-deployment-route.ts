'use client';

import { useEffect, useState } from 'react';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import { resolveModelDeploymentRoute } from '@/src/utils/resolve-model-deployment-route';

interface UseModelDeploymentRouteResult {
  modelRoute: ApplicationRoute | undefined;
  isLoading: boolean;
}

/** Resolves Catalog vs Entities Models route when the deployment type is dial-model. */
export function useModelDeploymentRoute(
  deploymentId: string | undefined,
  deploymentType: string | undefined,
): UseModelDeploymentRouteResult {
  const [modelRoute, setModelRoute] = useState<ApplicationRoute | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!deploymentId || deploymentType !== DeploymentType.Model) {
      setModelRoute(undefined);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setModelRoute(undefined);
    setIsLoading(true);

    resolveModelDeploymentRoute(deploymentId).then((route) => {
      if (!cancelled) {
        setModelRoute(route);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId, deploymentType]);

  return {
    modelRoute,
    isLoading: deploymentType === DeploymentType.Model && isLoading,
  };
}
