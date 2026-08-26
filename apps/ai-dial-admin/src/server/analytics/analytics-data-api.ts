import { Token } from '@/src/models/auth';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  SqlQueryRequest,
  StructuredQuery,
  StructuredQueryResult,
  TranslateResponse,
  TranslateSqlResponse,
} from '@/src/models/analytics/query';
import {
  SavedQuery,
  SavedQueryListResponse,
  SavedQueryRequest,
  SavedQueryScope,
} from '@/src/models/analytics/saved-query';
import { CreateEvaluatorDto, Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { CreateRuleDto, EnrichmentRule, RuleEnabledFilter, RulesListFilters } from '@/src/models/analytics/rule';
import {
  AnalyticsSchemaPatch,
  AnalyticsTable,
  CreateTableDto,
  DraftSchemaDto,
  TableAccess,
  UpdateTableDto,
  WriteRowsDto,
} from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';

export const QUERIES_URL = 'v1/queries';
export const QUERIES_ENTITIES_URL = `${QUERIES_URL}/entities`;
export const QUERIES_FUNCTIONS_URL = `${QUERIES_URL}/functions`;
export const QUERIES_EXECUTE_URL = `${QUERIES_URL}/execute`;
export const QUERIES_EXECUTE_SQL_URL = `${QUERIES_URL}/execute-sql`;
export const QUERIES_TRANSLATE_URL = `${QUERIES_URL}/translate`;
export const QUERIES_TRANSLATE_SQL_URL = `${QUERIES_URL}/translate-sql`;
export const QUERIES_ENTITY_SCHEMA_URL = (name: string): string =>
  `${QUERIES_ENTITIES_URL}/schema/${encodeURIComponent(name)}`;

export const SAVED_QUERIES_URL = 'v1/saved-queries';
export const SAVED_QUERY_URL = (id: string): string => `${SAVED_QUERIES_URL}/${encodeURIComponent(id)}`;
export const SAVED_QUERIES_SCOPE_URL = (scope: SavedQueryScope): string =>
  `${SAVED_QUERIES_URL}?scope=${encodeURIComponent(scope)}`;

// The service has shipped two envelopes for its list endpoints — a bare array and a `{key: [...]}`
// wrapper — and which one answers depends on the deployed build. Accepting both keeps the client
// working against either rather than reading the unexpected shape as a failure.
const unwrapList = <T>(res: unknown, key: string): T[] | null => {
  if (Array.isArray(res)) return res as T[];
  const wrapped = (res as Record<string, unknown> | null)?.[key];
  return Array.isArray(wrapped) ? (wrapped as T[]) : null;
};

export const RULES_URL = 'v1/rules';
export const RULE_URL = (id: string): string => `${RULES_URL}/${encodeURIComponent(id)}`;

export const RULES_LIST_URL = (filters?: RulesListFilters): string => {
  const params = new URLSearchParams();

  if (filters?.enabled === RuleEnabledFilter.Enabled) params.set('enabled', 'true');
  if (filters?.enabled === RuleEnabledFilter.Disabled) params.set('enabled', 'false');
  if (filters?.updatedSince) params.set('updated_since', filters.updatedSince);

  const query = params.toString();
  return query ? `${RULES_URL}?${query}` : RULES_URL;
};

export const EVALUATORS_URL = 'v1/evaluators';
export const EVALUATOR_URL = (name: string): string => `${EVALUATORS_URL}/${encodeURIComponent(name)}`;
export const EVALUATOR_VERSION_URL = (name: string, version: number): string =>
  `${EVALUATOR_URL(name)}/versions/${encodeURIComponent(String(version))}`;

export const TABLES_URL = 'v1/tables';
export const TABLE_URL = (name: string): string => `${TABLES_URL}/${encodeURIComponent(name)}`;
export const TABLE_SCHEMA_URL = (name: string): string => `${TABLE_URL(name)}/schema`;
export const TABLE_ROWS_URL = (name: string): string => `${TABLE_URL(name)}/rows`;
export const TABLE_ACCESS_URL = (name: string): string => `${TABLE_URL(name)}/access`;

export class AnalyticsDataApi extends BaseApi {
  checkAccess(token: Token): Promise<ServerActionResponse> {
    return this.getAction(QUERIES_ENTITIES_URL, token);
  }

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

  // Validation-only translation (never contacts ClickHouse): renders a structured query as the
  // external-dialect SQL subset `executeSqlAction` accepts. Rejected with 400 when the DSL is not
  // expressible in that subset.
  translateAction(query: StructuredQuery, token: Token): Promise<ServerActionResponse<TranslateResponse>> {
    return this.postAction<StructuredQuery>(QUERIES_TRANSLATE_URL, query, token);
  }

  // Validation-only reverse translation: parses a SQL SELECT into the structured DSL the `execute`
  // endpoint accepts verbatim. Rejected with 400 for unparseable/unsupported SQL.
  translateSqlAction(sql: string, token: Token): Promise<ServerActionResponse<TranslateSqlResponse>> {
    return this.postAction<SqlQueryRequest>(QUERIES_TRANSLATE_SQL_URL, { sql }, token);
  }

  // Saved queries. Reads use `get` — a failure is indistinguishable from an empty result to the
  // caller, which is all the list and the detail page need. Writes use the `*Action` variants
  // because their failures are load-bearing: the caller branches on the machine code the envelope
  // carries (see `utils/saved-query-error.ts`).
  async listSavedQueries(scope: SavedQueryScope, token: Token): Promise<SavedQuery[] | null> {
    const res = await this.get<SavedQueryListResponse>(SAVED_QUERIES_SCOPE_URL(scope), token);
    return res?.saved_queries ?? null;
  }

  getSavedQuery(id: string, token: Token): Promise<SavedQuery | null> {
    return this.get<SavedQuery>(SAVED_QUERY_URL(id), token);
  }

  createSavedQuery(dto: SavedQueryRequest, token: Token): Promise<ServerActionResponse<SavedQuery>> {
    return this.postAction<SavedQueryRequest>(SAVED_QUERIES_URL, dto, token);
  }

  // Full replace. Deliberately no If-Match: the service returns `generation` but accepts no
  // precondition header, so concurrent writes are last-write-wins by contract.
  updateSavedQuery(id: string, dto: SavedQueryRequest, token: Token): Promise<ServerActionResponse<SavedQuery>> {
    return this.putAction<SavedQueryRequest>(SAVED_QUERY_URL(id), dto, token);
  }

  deleteSavedQuery(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(SAVED_QUERY_URL(id), token);
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

  updateTable(name: string, dto: UpdateTableDto, token: Token): Promise<ServerActionResponse> {
    return this.putAction<UpdateTableDto>(TABLE_URL(name), dto, token);
  }

  deleteTable(name: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(TABLE_URL(name), token);
  }

  // Defines the complete physical schema of a not-yet-materialized table AND materializes it (issues
  // CREATE TABLE, flips to ACTIVE) in one atomic call — there is no separate draft-save/materialize step.
  defineTableSchema(name: string, dto: DraftSchemaDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<DraftSchemaDto>(TABLE_SCHEMA_URL(name), dto, token);
  }

  updateTableSchema(name: string, patch: AnalyticsSchemaPatch, token: Token): Promise<ServerActionResponse> {
    return this.patchAction<AnalyticsSchemaPatch>(TABLE_SCHEMA_URL(name), patch, token);
  }

  addRows(name: string, dto: WriteRowsDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<WriteRowsDto>(TABLE_ROWS_URL(name), dto, token);
  }

  // Per-table role lists (write/modify). Admin-only on the backend; a non-admin GET is rejected 403.
  getTableAccess(name: string, token: Token): Promise<TableAccess | null> {
    return this.get<TableAccess>(TABLE_ACCESS_URL(name), token);
  }

  // Full-replace of the table's role lists (admin-only).
  replaceTableAccess(name: string, access: TableAccess, token: Token): Promise<ServerActionResponse> {
    return this.putAction<TableAccess>(TABLE_ACCESS_URL(name), access, token);
  }

  async getRules(filters: RulesListFilters | undefined, token: Token): Promise<EnrichmentRule[] | null> {
    const res = await this.get<object>(RULES_LIST_URL(filters), token);
    return unwrapList<EnrichmentRule>(res, 'items');
  }

  getRule(id: string, token: Token): Promise<EnrichmentRule | null> {
    return this.get<EnrichmentRule>(RULE_URL(id), token);
  }

  createRule(dto: CreateRuleDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<CreateRuleDto>(RULES_URL, dto, token);
  }

  updateRule(id: string, dto: CreateRuleDto, token: Token): Promise<ServerActionResponse> {
    return this.putAction<CreateRuleDto>(RULE_URL(id), dto, token);
  }

  deleteRule(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(RULE_URL(id), token);
  }

  async getEvaluators(token: Token): Promise<EvaluatorSummary[] | null> {
    const res = await this.get<object>(EVALUATORS_URL, token);
    return unwrapList<EvaluatorSummary>(res, 'items');
  }

  getEvaluator(name: string, token: Token): Promise<Evaluator | null> {
    return this.get<Evaluator>(EVALUATOR_URL(name), token);
  }

  getEvaluatorVersion(name: string, version: number, token: Token): Promise<Evaluator | null> {
    return this.get<Evaluator>(EVALUATOR_VERSION_URL(name, version), token);
  }

  // The registry's only mutation: PUT and DELETE on a version answer 409 `evaluator_immutable`.
  createEvaluator(dto: CreateEvaluatorDto, token: Token): Promise<ServerActionResponse<Evaluator>> {
    return this.postAction<CreateEvaluatorDto>(EVALUATORS_URL, dto, token);
  }
}
