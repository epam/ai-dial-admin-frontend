'use client';

import { FC, useCallback } from 'react';

import { BackfillRange } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import TableBackfillSidebarView from '@/src/components/Analytics/Tables/Backfill/TableBackfillSidebarView';
import { useTableBackfillRuns } from '@/src/components/Analytics/Tables/Backfill/use-table-backfill-runs';
import { TableBackfillRun } from '@/src/models/analytics/table-backfill';

interface Props {
  /** Called with every answer, so the banner on the listing stays current while this is open. */
  onRunsChange: (runs: TableBackfillRun[]) => void;
}

/** The drawer content over the ingest service: reads its runs, polls the one in progress, starts new ones. */
const TableBackfillSidebar: FC<Props> = ({ onRunsChange }) => {
  const { runs, isStarting, start } = useTableBackfillRuns(onRunsChange);
  const onStart = useCallback(
    (range: BackfillRange, shouldIncludeIngested: boolean) => start(range.from, range.to, shouldIncludeIngested),
    [start],
  );

  return <TableBackfillSidebarView runs={runs} isStarting={isStarting} onStart={onStart} />;
};

export default TableBackfillSidebar;
