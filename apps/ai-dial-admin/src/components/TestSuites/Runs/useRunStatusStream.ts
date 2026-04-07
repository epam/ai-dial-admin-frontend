import { useEffect } from 'react';

import { GridApi } from 'ag-grid-community';

import { ApiRoute } from '@/src/constants/api-routes';

interface StatusUpdateEvent {
  runId: string;
  testSuiteId: string;
  status: string;
  message: string;
  timestamp: number;
}

export function useRunStatusStream(testSuiteId: string | undefined, gridApi: GridApi | null) {
  useEffect(() => {
    if (!testSuiteId || !gridApi) return;

    const eventSource = new EventSource(`${ApiRoute.RunsStatusStream}?testSuiteIds=${encodeURIComponent(testSuiteId)}`);

    const handleStatusUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StatusUpdateEvent;

        gridApi.forEachNode((node) => {
          if (node.data?.id === data.runId) {
            node.setData({ ...node.data, status: data.status, completedAt: data.timestamp });
          }
        });
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
