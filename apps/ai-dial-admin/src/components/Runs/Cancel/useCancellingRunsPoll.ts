import { useEffect } from 'react';

import { GridApi, IRowNode } from 'ag-grid-community';

import { getRun } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { RUN_CANCEL_POLL_INTERVAL } from '@/src/constants/runs';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { getErrorNotification } from '@/src/utils/notification';

/**
 * Re-checks every `CANCELLING` row a grid currently holds until it leaves that status, because the
 * backend reports the outcome of a cancellation only on the run itself.
 *
 * The rows are read from the grid on each tick rather than tracked in state: with an infinite
 * datasource every page fetch replaces the rows, so any mirror of "which runs are cancelling" would
 * silently miss the ones that arrive from the server already `CANCELLING`.
 */
export function useCancellingRunsPoll(gridApi: GridApi | null, isEnabled = true) {
  const t = useI18n();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!gridApi || !isEnabled) {
      return;
    }

    const setRowStatus = (id: string, status?: RunStatus) => {
      gridApi.forEachNode((node: IRowNode<Run>) => {
        if (node.data?.id === id && node.data.status !== status) {
          node.setData({ ...node.data, status });
        }
      });
    };

    const pollCancellingRuns = async () => {
      const cancellingIds: string[] = [];
      gridApi.forEachNode((node: IRowNode<Run>) => {
        if (node.data?.status === RunStatus.CANCELLING && node.data.id) {
          cancellingIds.push(node.data.id);
        }
      });

      if (!cancellingIds.length) {
        return;
      }

      await Promise.allSettled(
        cancellingIds.map(async (id) => {
          const run = await getRun(id);
          if (!run?.status || run.status === RunStatus.CANCELLING) {
            return;
          }

          // A run is polled only while it is CANCELLING, so seeing it RUNNING again means the
          // cancellation did not take effect.
          if (run.status === RunStatus.RUNNING) {
            showNotification(
              getErrorNotification(t(RunsI18nKey.CancelRunFailed), t(RunsI18nKey.CancelRunFailedDescription)),
            );
          }

          setRowStatus(id, run.status);
        }),
      );
    };

    const interval = setInterval(() => {
      void pollCancellingRuns();
    }, RUN_CANCEL_POLL_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [gridApi, isEnabled, showNotification, t]);
}
