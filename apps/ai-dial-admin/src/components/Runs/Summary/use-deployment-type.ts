'use client';

import { useEffect, useState } from 'react';

import { TestSuiteDeploymentRef } from '@/src/models/evaluation/test-suite';
import { resolveDeploymentType } from './resolve-deployment-type';

interface UseDeploymentTypeResult {
  deploymentType: string | undefined;
  isLoading: boolean;
}

export function useDeploymentType(deploymentRef?: TestSuiteDeploymentRef | null): UseDeploymentTypeResult {
  const deploymentId = deploymentRef?.id;
  const storedType = deploymentRef?.type;
  const [fallbackType, setFallbackType] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (storedType || !deploymentId) {
      setFallbackType(undefined);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setFallbackType(undefined);
    setIsLoading(true);

    resolveDeploymentType(deploymentId).then((type) => {
      if (!cancelled) {
        setFallbackType(type);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId, storedType]);

  return {
    deploymentType: storedType ?? fallbackType,
    isLoading: !storedType && isLoading,
  };
}
