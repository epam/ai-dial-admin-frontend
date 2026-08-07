import { Token } from '@/src/models/auth';
import {
  SavedQuery,
  SavedQueryListResponse,
  SavedQueryRequest,
  SavedQueryScope,
} from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';

export const SAVED_QUERIES_URL = 'v1/saved-queries';
export const SAVED_QUERY_URL = (id: string): string => `${SAVED_QUERIES_URL}/${encodeURIComponent(id)}`;
export const SAVED_QUERIES_SCOPE_URL = (scope: SavedQueryScope): string =>
  `${SAVED_QUERIES_URL}?scope=${encodeURIComponent(scope)}`;

export class SavedQueriesApi extends BaseApi {
  // Every entry carries the full saved query — body, time, and chart included — so nothing needs a
  // follow-up read when a row is selected. Rows come back most recently updated first.
  async listSavedQueries(scope: SavedQueryScope, token: Token): Promise<SavedQuery[] | null> {
    const res = await this.get<SavedQueryListResponse>(SAVED_QUERIES_SCOPE_URL(scope), token);
    return res?.saved_queries ?? null;
  }

  // Writes go through the action variants because their failures are load-bearing: the caller branches
  // on the machine code in `errorHeader` to tell an untranslatable body from a sensitive literal from
  // an unresolvable principal.
  createSavedQuery(dto: SavedQueryRequest, token: Token): Promise<ServerActionResponse<SavedQuery>> {
    return this.postAction<SavedQueryRequest>(SAVED_QUERIES_URL, dto, token);
  }

  getSavedQuery(id: string, token: Token): Promise<SavedQuery | null> {
    return this.get<SavedQuery>(SAVED_QUERY_URL(id), token);
  }

  // A full replace: the service preserves id, owner and created_at, bumps generation, and refreshes
  // updated_at. The body carries only the nine accepted fields — anything server-assigned is a 422.
  updateSavedQuery(id: string, dto: SavedQueryRequest, token: Token): Promise<ServerActionResponse<SavedQuery>> {
    return this.putAction<SavedQueryRequest>(SAVED_QUERY_URL(id), dto, token);
  }

  deleteSavedQuery(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(SAVED_QUERY_URL(id), token);
  }
}
