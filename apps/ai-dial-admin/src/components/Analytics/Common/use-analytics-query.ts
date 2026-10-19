'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { DEFAULT_CSV_EXPORT_FILE_NAME } from '@/src/constants/analytics/query-builder';
import { ApiRoute } from '@/src/constants/api-routes';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';
import { DownloadedFile } from '@/src/models/download';
import { ServerActionResponse } from '@/src/models/server-action';
import { getFileNameFromContentDisposition } from '@/src/utils/api/get-file-name';
import { getTotalCount } from '@/src/utils/api/get-total-count';

export interface QueryOutcome {
  /** The service answered. A success with no body still succeeded, which `result` alone cannot say. */
  isSuccess: boolean;
  result: StructuredQueryResult | null;
  /** What to show: the service's message, or its header where it sent no message. */
  error?: string;
  /** The header on its own, for a caller that titles its notification with it. */
  errorHeader?: string;
  requestId?: string;
  /** The view asked and then went away. Neither a result nor a failure: nobody is waiting to be told. */
  isCancelled?: boolean;
}

type Failure = Omit<QueryOutcome, 'result'>;

export interface CsvOutcome extends Failure {
  file: DownloadedFile | null;
}

export interface AnalyticsQueryRunner {
  runQuery: (query: StructuredQuery) => Promise<QueryOutcome>;
  runSql: (sql: string) => Promise<QueryOutcome>;
  /** Sends `request` to the CSV twin of the endpoint that would run it, body as given. */
  exportCsv: (request: QueryRunRequest) => Promise<CsvOutcome>;
}

const CSV_CONTENT_TYPE = 'text/csv';

// The handler answers with an envelope even when it fails, but a proxy or a crashed route can still put a
// page of HTML on the wire — so a body that will not parse is reported as the status it came with rather
// than as whatever the JSON parser had to say about it.
const readEnvelope = async <T extends object>(
  res: Response,
): Promise<{ envelope: ServerActionResponse<T> | null; failure: Failure }> => {
  const envelope = (await res.json().catch(() => null)) as ServerActionResponse<T> | null;

  if (!envelope) {
    return { envelope: null, failure: { isSuccess: false, error: `${res.status} ${res.statusText}`.trim() } };
  }

  return {
    envelope,
    failure: {
      isSuccess: Boolean(envelope.success),
      error: envelope.errorMessage ?? envelope.errorHeader,
      errorHeader: envelope.errorHeader,
      requestId: envelope.requestId,
    },
  };
};

const readCsvFile = async (res: Response): Promise<DownloadedFile> => {
  const totalCount = getTotalCount(res);

  return {
    blob: await res.blob(),
    fileName: getFileNameFromContentDisposition(res.headers.get('content-disposition')) ?? DEFAULT_CSV_EXPORT_FILE_NAME,
    ...(totalCount != null && { totalCount }),
  };
};

const toBody = (request: QueryRunRequest) =>
  request.kind === QueryRequestKind.Sql ? { sql: request.sql } : { query: request.query };

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

  // Every read through here shares one shape: the controller is registered so an unmount aborts it, an abort
  // is reported as a cancellation rather than a failure, and nothing rejects.
  const send = useCallback(
    async <R>(
      route: ApiRoute,
      body: object,
      read: (res: Response) => Promise<R>,
      fail: (failure: Failure) => R,
    ): Promise<R> => {
      const controller = new AbortController();
      controllers.current.add(controller);

      try {
        const res = await fetch(route, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        return await read(res);
      } catch (error) {
        // The abort arrives as a rejection; it is read from the controller rather than from the error, whose
        // name and wording differ between browsers and the test environment.
        if (controller.signal.aborted) {
          return fail({ isSuccess: false, isCancelled: true });
        }

        return fail({ isSuccess: false, error: error instanceof Error ? error.message : void 0 });
      } finally {
        controllers.current.delete(controller);
      }
    },
    [],
  );

  const post = useCallback(
    (body: object): Promise<QueryOutcome> =>
      send<QueryOutcome>(
        ApiRoute.AnalyticsQuery,
        body,
        async (res) => {
          const { envelope, failure } = await readEnvelope<StructuredQueryResult>(res);
          return { ...failure, result: envelope?.success ? (envelope.response ?? null) : null };
        },
        (failure) => ({ ...failure, result: null }),
      ),
    [send],
  );

  // A file and a failure share the route, so the content type tells them apart: the bytes are only ever
  // `text/csv`, the failure only ever the envelope.
  const exportCsv = useCallback(
    (request: QueryRunRequest): Promise<CsvOutcome> =>
      send<CsvOutcome>(
        ApiRoute.AnalyticsQueryCsv,
        toBody(request),
        async (res) => {
          if (res.ok && res.headers.get('content-type')?.startsWith(CSV_CONTENT_TYPE)) {
            return { isSuccess: true, file: await readCsvFile(res) };
          }

          const { failure } = await readEnvelope<object>(res);
          return { ...failure, isSuccess: false, file: null };
        },
        (failure) => ({ ...failure, file: null }),
      ),
    [send],
  );

  return useMemo(
    () => ({
      runQuery: (query: StructuredQuery) => post({ query }),
      runSql: (sql: string) => post({ sql }),
      exportCsv,
    }),
    [post, exportCsv],
  );
};
