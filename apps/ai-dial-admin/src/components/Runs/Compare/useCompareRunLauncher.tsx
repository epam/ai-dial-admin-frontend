'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import SelectCompareRunModal from '@/src/components/Runs/Compare/SelectCompareRunModal';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import {
  fetchSuiteCompletedRuns,
  getCompareRunsUrn,
  getSelectableCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import { Run } from '@/src/models/evaluation/run';

export const useCompareRunLauncher = () => {
  const [primaryRun, setPrimaryRun] = useState<Run | null>(null);
  const [suiteRuns, setSuiteRuns] = useState<Run[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectableRuns = useMemo(() => {
    if (!primaryRun?.id) return [];
    return getSelectableCompareRuns(suiteRuns, CompareRunSlot.Secondary, primaryRun.id, null);
  }, [primaryRun?.id, suiteRuns]);

  const openCompareRun = useCallback((run?: Run) => {
    if (!run?.id || !run.testSuiteId) return;

    setPrimaryRun(run);
    setIsModalOpen(true);
    setSuiteRuns([]);

    fetchSuiteCompletedRuns(run.testSuiteId).then((runs) => {
      setSuiteRuns(runs);
    });
  }, []);

  const closeCompareRun = useCallback(() => {
    setIsModalOpen(false);
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
            onClose={closeCompareRun}
            onApply={onApplyCompareRun}
          />,
          document.body,
        )
      : null;

  return { openCompareRun, compareRunModal };
};
