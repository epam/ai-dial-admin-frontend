'use client';

import { FC, useCallback, useState } from 'react';

import BackfillSection from '@/src/components/Analytics/Common/BackfillSidebar/BackfillSection';
import { BackfillRange } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import TableBackfillRunsList from '@/src/components/Analytics/Tables/Backfill/TableBackfillRunsList';
import TableBackfillRunView from '@/src/components/Analytics/Tables/Backfill/TableBackfillRunView';
import TableBackfillStartForm from '@/src/components/Analytics/Tables/Backfill/TableBackfillStartForm';
import { findRunningTableBackfill } from '@/src/components/Analytics/Tables/Backfill/use-table-backfill-runs';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TableBackfillRun } from '@/src/models/analytics/table-backfill';

interface Props {
  runs: TableBackfillRun[];
  isStarting: boolean;
  onStart: (range: BackfillRange) => Promise<boolean>;
}

/**
 * The Backfill data drawer's content, in three blocks, from the runs it is given: the start form first (offered
 * only while no run is in progress), then one run (the chosen one, else the one in progress, else the newest), then
 * the retained runs, absent when there are none. Presentation only: the caller supplies the runs and what starting
 * one does.
 */
const TableBackfillSidebarView: FC<Props> = ({ runs, isStarting, onStart }) => {
  const t = useI18n();
  const [selectedRunId, setSelectedRunId] = useState<string>();

  const runningRun = findRunningTableBackfill(runs);
  // A chosen run is shown even while another is in progress; starting a run drops the choice, so the new one
  // is what the reader sees next.
  const presented = runs.find((run) => run.runId === selectedRunId) ?? runningRun ?? runs[0];

  const onStartRange = useCallback(
    async (range: BackfillRange) => {
      if (await onStart(range)) setSelectedRunId(undefined);
    },
    [onStart],
  );

  return (
    <div className="flex flex-col gap-y-4">
      {!runningRun && (
        <BackfillSection title={t(BackfillI18nKey.SectionStart)}>
          <TableBackfillStartForm isStarting={isStarting} onStart={(range) => void onStartRange(range)} />
        </BackfillSection>
      )}
      {presented && (
        <BackfillSection title={t(BackfillI18nKey.SectionRun)}>
          <TableBackfillRunView
            run={presented}
            isAnyRunInProgress={Boolean(runningRun)}
            isStarting={isStarting}
            onRerun={(range) => void onStartRange(range)}
          />
        </BackfillSection>
      )}
      <TableBackfillRunsList runs={runs} selectedRunId={presented?.runId} onSelect={setSelectedRunId} />
    </div>
  );
};

export default TableBackfillSidebarView;
