'use client';

import { useEffect, useState } from 'react';

import { getTestSuitesForDeployment } from '@/src/app/[lang]/test-suites/actions';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface EntityTestSuitesState {
  suites: TestSuite[];
  isLoading: boolean;
}

export const useEntityTestSuites = (deploymentId: string | undefined): EntityTestSuitesState => {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!deploymentId) {
      setSuites([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setSuites([]);
    setIsLoading(true);

    void getTestSuitesForDeployment(deploymentId).then((result) => {
      if (cancelled) {
        return;
      }
      setSuites(result ?? []);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId]);

  return { suites, isLoading };
};
