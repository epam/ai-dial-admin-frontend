'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { ApiRoute } from '@/src/constants/api-routes';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { ServerActionResponse } from '@/src/models/server-action';

export interface QueryOutcome {
  /** The service answered. A success with no body still succeeded, which `result` alone cannot say. */
  isSuccess: boolean;
  result: StructuredQueryResult | null;
  error?: string;
  errorHeader?: string;
  requestId?: string;
  /** The view asked and then went away. Neither a result nor a failure: nobody is waiting to be told. */
  isCancelled?: boolean;
}

export interface AnalyticsQueryRunner {
  runQuery: (query: StructuredQuery) => Promise<QueryOutcome>;
  runSql: (sql: string) => Promise<QueryOutcome>;
}

/**
 * Runs analytics queries for the view that calls it, and cancels whatever is still in flight when that view
 * unmounts — in the service as well as in the browser, since the route handler hands the signal on.
 *
 * This exists because a server action cannot be cancelled. A page issuing several long reads, left before
 * they land, used to keep every one of them running and then report the framework's own abort message as a
 * failed load — a toast for a page the operator had already left.
 *
 * Neither call rejects: a transport failure would otherwise become an unhandled rejection with no `.then`
 * to run, leaving the widget that asked for it on its skeleton for good.
 */
export const useAnalyticsQuery = (): AnalyticsQueryRunner => {
  const controllers = useRef(new Set<AbortController>());

  useEffect(() => {
    const live = controllers.current;

    return () => {
      live.forEach((controller) => controller.abort());
      live.clear();
    };
  }, []);

  const post = useCallback(async (body: object): Promise<QueryOutcome> => {
    const controller = new AbortController();
    controllers.current.add(controller);

    try {
      const res = await fetch(ApiRoute.AnalyticsQuery, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const envelope = (await res.json()) as ServerActionResponse<StructuredQueryResult>;

      return {
        isSuccess: Boolean(envelope?.success),
        result: envelope?.success ? (envelope.response ?? null) : null,
        error: envelope?.errorMessage,
        errorHeader: envelope?.errorHeader,
        requestId: envelope?.requestId,
      };
    } catch (error) {
      // The abort arrives as a rejection; it is read from the controller rather than from the error, whose
      // name and wording differ between browsers and the test environment.
      if (controller.signal.aborted) {
        return { isSuccess: false, result: null, isCancelled: true };
      }

      return { isSuccess: false, result: null, error: error instanceof Error ? error.message : void 0 };
    } finally {
      controllers.current.delete(controller);
    }
  }, []);

  return useMemo(
    () => ({
      runQuery: (query: StructuredQuery) => post({ query }),
      runSql: (sql: string) => post({ sql }),
    }),
    [post],
  );
};
