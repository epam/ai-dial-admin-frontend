'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import SelectCompareRunModal from '@/src/components/Runs/Compare/SelectCompareRunModal';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareCandidateRun } from '@/src/components/Runs/Compare/models';
import {
  fetchCompareCandidateRuns,
  getCompareRunsUrn,
  getSelectableCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import { Run } from '@/src/models/evaluation/run';

export const useCompareRunLauncher = () => {
  const [primaryRun, setPrimaryRun] = useState<Run | null>(null);
  const [suiteRuns, setSuiteRuns] = useState<CompareCandidateRun[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const latestRequestRef = useRef(0);

  const selectableRuns = useMemo(() => {
    if (!primaryRun?.id) return [];
    return getSelectableCompareRuns(suiteRuns, CompareRunSlot.Secondary, primaryRun.id, null);
  }, [primaryRun?.id, suiteRuns]);

  const openCompareRun = useCallback(async (run?: Run) => {
    if (!run?.id || !run.testSuiteId) return;

    setPrimaryRun(run);
    setIsModalOpen(true);
    setIsLoading(true);
    setSuiteRuns([]);

    const requestId = ++latestRequestRef.current;
    let runs: CompareCandidateRun[] = [];
    try {
      runs = await fetchCompareCandidateRuns(run.testSuiteId);
    } catch {
      // The picker falls back to its empty state
    }

    if (requestId === latestRequestRef.current) {
      setSuiteRuns(runs);
      setIsLoading(false);
    }
  }, []);

  const closeCompareRun = useCallback(() => {
    latestRequestRef.current++;
    setIsModalOpen(false);
    setIsLoading(false);
    setPrimaryRun(null);
    setSuiteRuns([]);
  }, []);

  const onApplyCompareRun = useCallback(
    (secondaryRunId: string) => {
      if (!primaryRun?.id) return;

      window.open(getCompareRunsUrn(primaryRun.id, secondaryRunId), '_blank');
      closeCompareRun();
    },
    [closeCompareRun, primaryRun?.id],
  );

  const compareRunModal =
    isModalOpen && primaryRun
      ? createPortal(
          <SelectCompareRunModal
            isModalOpen
            runs={selectableRuns}
            isLoading={isLoading}
            onClose={closeCompareRun}
            onApply={onApplyCompareRun}
          />,
          document.body,
        )
      : null;

  return { openCompareRun, compareRunModal };
};
