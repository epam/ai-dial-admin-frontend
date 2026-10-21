import { Token } from '@/src/models/auth';
import { QueryEntity, QueryEntitySchema } from '@/src/models/evaluation/query-entity';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/evaluation/structured-query';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const QUERIES_URL = `${API}/queries`;
export const QUERIES_EXECUTE_URL = `${QUERIES_URL}/execute`;
export const QUERIES_ENTITIES_URL = `${QUERIES_URL}/entities`;
export const QUERIES_ENTITY_SCHEMA_URL = (name: string): string =>
  `${QUERIES_ENTITIES_URL}/schema/${encodeURIComponent(name)}`;

/**
 * Client for the experimental structured-query endpoint. Translates a {@link StructuredQuery}
 * to SQL on the backend and returns the projected rows.
 */
export class StructuredQueryApi extends BaseApi {
  execute(query: StructuredQuery, token: Token): Promise<StructuredQueryResult | null> {
    return this.post<StructuredQuery, StructuredQueryResult>(QUERIES_EXECUTE_URL, query, token);
  }

  getEntities(token: Token): Promise<QueryEntity[] | null> {
    return this.get<QueryEntity[]>(QUERIES_ENTITIES_URL, token);
  }

  getEntitySchema(name: string, token: Token): Promise<QueryEntitySchema | null> {
    return this.get<QueryEntitySchema>(QUERIES_ENTITY_SCHEMA_URL(name), token);
  }
}
