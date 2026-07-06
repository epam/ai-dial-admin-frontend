import { Token } from '@/src/models/auth';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/evaluation/structured-query';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const QUERIES_EXECUTE_URL = `${API}/queries/execute`;

/**
 * Client for the experimental structured-query endpoint. Translates a {@link StructuredQuery}
 * to SQL on the backend and returns the projected rows.
 */
export class StructuredQueryApi extends BaseApi {
  execute(query: StructuredQuery, token: Token): Promise<StructuredQueryResult | null> {
    return this.post<StructuredQuery, StructuredQueryResult>(QUERIES_EXECUTE_URL, query, token);
  }
}
