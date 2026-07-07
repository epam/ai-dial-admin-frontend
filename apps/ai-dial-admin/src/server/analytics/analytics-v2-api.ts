import { Token } from '@/src/models/auth';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { AnalyticsSchemaPatch, AnalyticsTable, CreateTableDto, WriteRowsDto } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';

// Queries (schema discovery + query builder)
export const QUERIES_URL = '/v1/queries';
export const QUERIES_ENTITIES_URL = `${QUERIES_URL}/entities`;
export const QUERIES_EXECUTE_URL = `${QUERIES_URL}/execute`;
export const QUERIES_ENTITY_SCHEMA_URL = (name: string): string =>
  `${QUERIES_ENTITIES_URL}/schema/${encodeURIComponent(name)}`;

// Tables
export const TABLES_URL = '/v1/tables';
export const TABLE_URL = (name: string): string => `${TABLES_URL}/${encodeURIComponent(name)}`;
export const TABLE_SCHEMA_URL = (name: string): string => `${TABLE_URL(name)}/schema`;
export const TABLE_ROWS_URL = (name: string): string => `${TABLE_URL(name)}/rows`;

/**
 * Single client for the Analytics 2.0 data-access service (host: DIAL_ANALYTICS_API_URL).
 * Covers both the `/v1/queries` (entities, schema, execute) and `/v1/tables`
 * (CRUD, schema patch, row writes) endpoint families.
 */
export class AnalyticsV2Api extends BaseApi {
  // --- Queries ---
  getEntities(token: Token): Promise<AnalyticsEntity[] | null> {
    return this.get<AnalyticsEntity[]>(QUERIES_ENTITIES_URL, token);
  }

  getEntitySchema(name: string, token: Token): Promise<AnalyticsEntitySchema | null> {
    return this.get<AnalyticsEntitySchema>(QUERIES_ENTITY_SCHEMA_URL(name), token);
  }

  execute(query: StructuredQuery, token: Token): Promise<StructuredQueryResult | null> {
    return this.post<StructuredQuery, StructuredQueryResult>(QUERIES_EXECUTE_URL, query, token);
  }

  // --- Tables ---
  getTables(token: Token): Promise<AnalyticsTable[] | null> {
    return this.get<AnalyticsTable[]>(TABLES_URL, token);
  }

  getTable(name: string, token: Token): Promise<AnalyticsTable | null> {
    return this.get<AnalyticsTable>(TABLE_URL(name), token);
  }

  createTable(dto: CreateTableDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<CreateTableDto>(TABLES_URL, dto, token);
  }

  deleteTable(name: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(TABLE_URL(name), token);
  }

  updateTableSchema(name: string, patch: AnalyticsSchemaPatch, token: Token): Promise<ServerActionResponse> {
    return this.patchAction<AnalyticsSchemaPatch>(TABLE_SCHEMA_URL(name), patch, token);
  }

  addRows(name: string, dto: WriteRowsDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<WriteRowsDto>(TABLE_ROWS_URL(name), dto, token);
  }
}
