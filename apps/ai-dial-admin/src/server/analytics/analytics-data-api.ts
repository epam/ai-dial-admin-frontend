import { Token } from '@/src/models/auth';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { SqlQueryRequest, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { AnalyticsSchemaPatch, AnalyticsTable, CreateTableDto, WriteRowsDto } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';

export const QUERIES_URL = 'v1/queries';
export const QUERIES_ENTITIES_URL = `${QUERIES_URL}/entities`;
export const QUERIES_FUNCTIONS_URL = `${QUERIES_URL}/functions`;
export const QUERIES_EXECUTE_URL = `${QUERIES_URL}/execute`;
export const QUERIES_EXECUTE_SQL_URL = `${QUERIES_URL}/execute-sql`;
export const QUERIES_ENTITY_SCHEMA_URL = (name: string): string =>
  `${QUERIES_ENTITIES_URL}/schema/${encodeURIComponent(name)}`;

export const TABLES_URL = 'v1/tables';
export const TABLE_URL = (name: string): string => `${TABLES_URL}/${encodeURIComponent(name)}`;
export const TABLE_SCHEMA_URL = (name: string): string => `${TABLE_URL(name)}/schema`;
export const TABLE_ROWS_URL = (name: string): string => `${TABLE_URL(name)}/rows`;

export class AnalyticsDataApi extends BaseApi {
  getEntities(token: Token): Promise<AnalyticsEntity[] | null> {
    return this.get<AnalyticsEntity[]>(QUERIES_ENTITIES_URL, token);
  }

  getEntitySchema(name: string, token: Token): Promise<AnalyticsEntitySchema | null> {
    return this.get<AnalyticsEntitySchema>(QUERIES_ENTITY_SCHEMA_URL(name), token);
  }

  getFunctions(token: Token): Promise<QueryFunction[] | null> {
    return this.get<QueryFunction[]>(QUERIES_FUNCTIONS_URL, token);
  }

  executeAction(query: StructuredQuery, token: Token): Promise<ServerActionResponse<StructuredQueryResult>> {
    return this.postAction<StructuredQuery>(QUERIES_EXECUTE_URL, query, token);
  }

  // Ad-hoc SQL: the backend translates a single read-only SELECT to the structured DSL and runs it
  // through the same pipeline as `executeAction`, returning the same result envelope (no totalCount).
  executeSqlAction(sql: string, token: Token): Promise<ServerActionResponse<StructuredQueryResult>> {
    return this.postAction<SqlQueryRequest>(QUERIES_EXECUTE_SQL_URL, { sql }, token);
  }

  async getTables(token: Token): Promise<AnalyticsTable[] | null> {
    const res = await this.get<{ tables: AnalyticsTable[] }>(TABLES_URL, token);
    return res?.tables ?? null;
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
