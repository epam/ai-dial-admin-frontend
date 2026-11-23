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

    const load = async () => {
      try {
        const result = await getTestSuitesForDeployment(deploymentId);
        if (!cancelled) {
          setSuites(result ?? []);
        }
      } catch {
        if (!cancelled) {
          setSuites([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [deploymentId]);

  return { suites, isLoading };
};
