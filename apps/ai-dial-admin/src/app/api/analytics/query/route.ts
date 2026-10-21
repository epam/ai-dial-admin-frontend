import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { analyticsDataApi } from '@/src/app/api/api';
import { ServerActionResponse } from '@/src/models/server-action';
import { StructuredQuery } from '@/src/models/analytics/query';
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
 * The cancellable twin of the `executeQuery` server action: same token, same client method, same envelope.
 *
 * It exists because a server action carries no `AbortSignal`. A view that issues several long reads and is
 * then left behind cannot call them off through one — it can only stop listening, while the service keeps
 * scanning for a page nobody is looking at. A route handler is given the client's own signal, so an
 * abandoned read ends where the work is.
 *
 * Server-side prefetch keeps using the action: it runs before anything is on screen, so there is no caller
 * to cancel it.
 *
 * The auth check is the handler's own. `middleware.ts` excludes `/api` from its matcher, while a server
 * action posts to a page path the matcher covers — so without this a caller with no session would reach
 * the service with no `authorization` header rather than being turned away, which for this endpoint means
 * arbitrary read-only SQL.
 *
 * Every answer is the same envelope the action returns, failures included: the client reads one shape, and
 * a thrown transport error would otherwise reach it as Next's HTML error page and fail at `res.json()`.
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
    // Both arrive here so cancellation has one path: the service runs a SQL read through the same pipeline,
    // and the caller gets the same envelope either way.
    const envelope = sql
      ? await analyticsDataApi.executeSqlAction(sql, token, req.signal)
      : await analyticsDataApi.executeAction(query as StructuredQuery, token, req.signal);

    return envelopeResponse(envelope);
  } catch (error) {
    return envelopeResponse(
      {
        success: false,
        status: SERVER_ERROR,
        errorHeader: 'Query could not be run',
        errorMessage: error instanceof Error ? error.message : void 0,
      },
      SERVER_ERROR,
    );
  }
}
