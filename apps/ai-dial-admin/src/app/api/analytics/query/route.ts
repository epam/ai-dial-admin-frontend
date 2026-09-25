import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { analyticsDataApi } from '@/src/app/api/api';
import { StructuredQuery } from '@/src/models/analytics/query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

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
 */
interface QueryRequestBody {
  query?: StructuredQuery;
  sql?: string;
}

export async function POST(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { query, sql } = (await req.json()) as QueryRequestBody;

  // Both arrive here so cancellation has one path: the service runs a SQL read through the same pipeline,
  // and the caller gets the same envelope either way.
  const envelope = sql
    ? await analyticsDataApi.executeSqlAction(sql, token, req.signal)
    : await analyticsDataApi.executeAction(query as StructuredQuery, token, req.signal);

  return NextResponse.json(envelope);
}
