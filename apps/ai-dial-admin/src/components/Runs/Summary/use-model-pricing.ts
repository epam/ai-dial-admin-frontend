'use client';

import { useEffect, useState } from 'react';

import { resolveModelPricing } from '@/src/components/Runs/Summary/resolve-model-pricing';
import { hasModelPricing } from '@/src/components/Runs/Summary/utils';
import { DeploymentType } from '@/src/models/evaluation/deployment';

interface UseModelPricingResult {
  /**
   * True once a fetch has confirmed the deployed model has no price at all, so any run against it
   * can never produce a cost figure. False while that is still unknown (fetch pending, or the model
   * resource couldn't be fetched on either surface) or the deployment isn't a model — an Application
   * has no pricing of its own at the Admin level (see `resolveModelPricing`), so this never reports
   * true for one.
   */
  isDefinitelyUnpriced: boolean;
  isLoading: boolean;
}

/** Resolves whether a model deployment has no pricing configured, mirroring `useModelDeploymentRoute`'s shape. */
export function useModelPricing(
  deploymentId: string | undefined,
  deploymentType: string | undefined,
): UseModelPricingResult {
  const [isDefinitelyUnpriced, setIsDefinitelyUnpriced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!deploymentId || deploymentType !== DeploymentType.Model) {
      setIsDefinitelyUnpriced(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsDefinitelyUnpriced(false);
    setIsLoading(true);

    resolveModelPricing(deploymentId).then(({ isResolved, pricing }) => {
      if (!cancelled) {
        setIsDefinitelyUnpriced(isResolved && !hasModelPricing(pricing));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId, deploymentType]);

  return {
    isDefinitelyUnpriced,
    isLoading: deploymentType === DeploymentType.Model && isLoading,
  };
}
