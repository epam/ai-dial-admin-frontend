'use client';

import { useEffect, useState } from 'react';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import { resolveApplicationDeploymentRoute } from '@/src/utils/resolve-application-deployment-route';

interface UseApplicationDeploymentRouteResult {
  applicationRoute: ApplicationRoute | undefined;
  isLoading: boolean;
}

/** Resolves Platform vs Entities Applications route when the deployment type is dial-application. */
export function useApplicationDeploymentRoute(
  deploymentId: string | undefined,
  deploymentType: string | undefined,
): UseApplicationDeploymentRouteResult {
  const [applicationRoute, setApplicationRoute] = useState<ApplicationRoute | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!deploymentId || deploymentType !== DeploymentType.Application) {
      setApplicationRoute(undefined);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setApplicationRoute(undefined);
    setIsLoading(true);

    resolveApplicationDeploymentRoute(deploymentId).then((route) => {
      if (!cancelled) {
        setApplicationRoute(route);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId, deploymentType]);

  return {
    applicationRoute,
    isLoading: deploymentType === DeploymentType.Application && isLoading,
  };
}
