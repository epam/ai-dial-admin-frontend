import { useEffect } from 'react';

import { GridApi } from 'ag-grid-community';

import { getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { ApiRoute } from '@/src/constants/api-routes';
import { RunStatus } from '@/src/models/evaluation/run';
import { RUN_ID_FILTER } from './constants';

interface StatusUpdateEvent {
  runId: string;
  testSuiteId: string;
  status: string;
  message: string;
  timestamp: number;
}

const TERMINAL_RUN_STATUSES: string[] = [RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED];

export function useRunStatusStream(testSuiteId: string | undefined, gridApi: GridApi | null) {
  useEffect(() => {
    if (!testSuiteId || !gridApi) return;

    const eventSource = new EventSource(`${ApiRoute.RunsStatusStream}?testSuiteIds=${encodeURIComponent(testSuiteId)}`);

    const patchRowStatus = (data: StatusUpdateEvent) => {
      gridApi.forEachNode((node) => {
        if (node.data?.id === data.runId) {
          node.setData({ ...node.data, status: data.status, completedAt: data.timestamp });
        }
      });
    };

    // The stream event itself only ever carries status/timestamp, but a terminal status means the
    // backend has now computed metrics and the overall score — those only come back from a full
    // re-fetch of the run, so refetch it through the same query path the initial grid load uses.
    const refreshCompletedRow = async (data: StatusUpdateEvent) => {
      try {
        const result = await getRunsQuery(0, 1, [], [RUN_ID_FILTER(data.runId)]);
        const run = result?.content[0];
        if (!run) {
          patchRowStatus(data);
          return;
        }
        gridApi.forEachNode((node) => {
          if (node.data?.id === data.runId) {
            node.setData({ ...node.data, ...run });
          }
        });
      } catch {
        patchRowStatus(data);
      }
    };

    const handleStatusUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StatusUpdateEvent;

        if (TERMINAL_RUN_STATUSES.includes(data.status)) {
          void refreshCompletedRow(data);
        } else {
          patchRowStatus(data);
        }
      } catch {
        // ignore malformed events
      }
    };

    eventSource.addEventListener('status-update', handleStatusUpdate);

    eventSource.addEventListener('error', () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    });

    return () => {
      eventSource.close();
    };
  }, [testSuiteId, gridApi]);
}
