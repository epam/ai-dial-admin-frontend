import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { analyticsDataApi } from '@/src/app/api/api';
import { TOTAL_COUNT_HEADER } from '@/src/constants/api-headers';
import { DEFAULT_CSV_EXPORT_FILE_NAME } from '@/src/constants/analytics/query-builder';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ServerActionResponse } from '@/src/models/server-action';
import { buildFilenameDisposition } from '@/src/utils/api/create-stream-request';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

interface QueryRequestBody {
  query?: StructuredQuery;
  sql?: string;
}

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const SERVER_ERROR = 500;

const envelopeResponse = (envelope: ServerActionResponse, status?: number) =>
  NextResponse.json(envelope, status ? { status } : undefined);

/**
 * The CSV sibling of `/api/analytics/query`, for the same reason it exists: an export left behind is called
 * off in the service through the client's signal, which a server action cannot carry. Auth, body contract and
 * failure envelope are the sibling's, so the client reads a failure the same way; only a success differs —
 * the service's bytes, unchanged, as an attachment.
 */
export async function POST(req: NextRequest) {
  const isAuthRequired = getIsEnableAuthToggle();
  const token = await getUserToken(isAuthRequired, headers(), cookies());

  if (isAuthRequired && !token) {
    return envelopeResponse({ success: false, status: UNAUTHORIZED, errorHeader: 'Not authenticated' }, UNAUTHORIZED);
  }

  const { query, sql } = (await req.json().catch(() => ({}))) as QueryRequestBody;

  if (!sql && !query) {
    return envelopeResponse(
      { success: false, status: BAD_REQUEST, errorHeader: 'A query or a sql statement is required' },
      BAD_REQUEST,
    );
  }

  try {
    const envelope = sql
      ? await analyticsDataApi.executeSqlCsvAction(sql, token, req.signal)
      : await analyticsDataApi.executeCsvAction(query as StructuredQuery, token, req.signal);

    if (!envelope.success || !envelope.response) {
      return envelopeResponse(envelope);
    }

    const { blob, fileName, totalCount } = envelope.response;

    return new NextResponse(Buffer.from(await blob.arrayBuffer()), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': `attachment; ${buildFilenameDisposition(fileName || DEFAULT_CSV_EXPORT_FILE_NAME)}`,
        ...(totalCount != null && { [TOTAL_COUNT_HEADER]: String(totalCount) }),
      },
    });
  } catch (error) {
    return envelopeResponse(
      {
        success: false,
        status: SERVER_ERROR,
        errorHeader: 'Query could not be exported',
        errorMessage: error instanceof Error ? error.message : void 0,
      },
      SERVER_ERROR,
    );
  }
}
