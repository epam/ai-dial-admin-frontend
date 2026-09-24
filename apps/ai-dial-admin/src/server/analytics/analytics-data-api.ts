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
import {
  CreatePipelineDto,
  Pipeline,
  PipelineEnabledDto,
  PipelineEnabledFilter,
  PipelineKind,
  PipelineView,
  PipelinesListFilters,
} from '@/src/models/analytics/pipeline';
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

/** What the service answers when a declaration is too incomplete to compile. */
const UNPROCESSABLE = 422;

export const PIPELINES_URL = 'v1/pipelines';
export const PIPELINE_URL = (name: string): string => `${PIPELINES_URL}/${encodeURIComponent(name)}`;

// `Compiled` is what carries everything the service resolved — the composed response schema, the grain
// key, the version column, the output mapping and the read source — and it resolves for the `Enrich`
// kind alone: the service refuses it with 422 for any other kind rather than answering the declaration
// under the compiled name. So the projection is named per read, by whoever knows the kind.
export const PIPELINE_READ_URL = (name: string, view: PipelineView): string => `${PIPELINE_URL(name)}?view=${view}`;

export const PIPELINES_LIST_URL = (filters?: PipelinesListFilters): string => {
  const params = new URLSearchParams();

  if (filters?.kind) params.set('kind', filters.kind);
  if (filters?.enabled === PipelineEnabledFilter.Enabled) params.set('enabled', 'true');
  if (filters?.enabled === PipelineEnabledFilter.Disabled) params.set('enabled', 'false');
  if (filters?.updatedSince) params.set('updated_since', filters.updatedSince);

  // No `view`: the service serves `compiled` in a listing only alongside `kind=enrich` and refuses the
  // cross-kind combination with 400. The default `source` carries the authored transform, so the type
  // cell is unaffected; `inputs` it carries as declared rather than as resolved, which leaves the cell
  // empty for the one pipeline that declared no input and inherits its target's — read on that
  // pipeline's own page, which does ask for `compiled`.
  const query = params.toString();

  return query ? `${PIPELINES_URL}?${query}` : PIPELINES_URL;
};

// A 2xx whose body is not a shape the read accepts: `handleResponse` found no error to describe, so the
// envelope carries the failure and no words.
const unreadableBody = <T extends object>({ status, requestId }: ServerActionResponse): ServerActionResponse<T> => ({
  success: false,
  status,
  requestId,
});

export const TABLES_URL = 'v1/tables';
export const TABLE_URL = (name: string): string => `${TABLES_URL}/${encodeURIComponent(name)}`;
export const TABLE_SCHEMA_URL = (name: string): string => `${TABLE_URL(name)}/schema`;
export const TABLE_ROWS_URL = (name: string): string => `${TABLE_URL(name)}/rows`;
export const TABLE_ACCESS_URL = (name: string): string => `${TABLE_URL(name)}/access`;

export class AnalyticsDataApi extends BaseApi {
  checkAccess(token: Token): Promise<ServerActionResponse> {
    return this.getAction(QUERIES_ENTITIES_URL, token);
  }

  getEntities(token: Token): Promise<ServerActionResponse<AnalyticsEntity[]>> {
    return this.getAction(QUERIES_ENTITIES_URL, token);
  }

  getEntitySchema(name: string, token: Token): Promise<ServerActionResponse<AnalyticsEntitySchema>> {
    return this.getAction(QUERIES_ENTITY_SCHEMA_URL(name), token);
  }

  getFunctions(token: Token): Promise<ServerActionResponse<QueryFunction[]>> {
    return this.getAction(QUERIES_FUNCTIONS_URL, token);
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
  async listSavedQueries(scope: SavedQueryScope, token: Token): Promise<ServerActionResponse<SavedQuery[]>> {
    const res = await this.getAction(SAVED_QUERIES_SCOPE_URL(scope), token);

    if (!res.success) {
      return res;
    }

    const saved = (res.response as SavedQueryListResponse | undefined)?.saved_queries;
    return saved ? { ...res, response: saved } : unreadableBody(res);
  }

  async getSavedQuery(id: string, token: Token): Promise<ServerActionResponse<SavedQuery>> {
    const res = await this.getAction(SAVED_QUERY_URL(id), token);
    return res.success && !res.response ? unreadableBody(res) : res;
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

  async getTables(token: Token): Promise<ServerActionResponse<AnalyticsTable[]>> {
    const res = await this.getAction(TABLES_URL, token);

    if (!res.success) {
      return res;
    }

    const tables = (res.response as { tables?: AnalyticsTable[] } | undefined)?.tables;
    return tables ? { ...res, response: tables } : unreadableBody(res);
  }

  async getTable(name: string, token: Token): Promise<ServerActionResponse<AnalyticsTable>> {
    const res = await this.getAction(TABLE_URL(name), token);
    return res.success && !res.response ? unreadableBody(res) : res;
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
  getTableAccess(name: string, token: Token): Promise<ServerActionResponse<TableAccess>> {
    return this.getAction(TABLE_ACCESS_URL(name), token);
  }

  // Full-replace of the table's role lists (admin-only).
  replaceTableAccess(name: string, access: TableAccess, token: Token): Promise<ServerActionResponse> {
    return this.putAction<TableAccess>(TABLE_ACCESS_URL(name), access, token);
  }

  async getPipelines(
    filters: PipelinesListFilters | undefined,
    token: Token,
  ): Promise<ServerActionResponse<Pipeline[]>> {
    const res = await this.getAction(PIPELINES_LIST_URL(filters), token);

    if (!res.success) {
      return res;
    }

    const pipelines = unwrapList<Pipeline>(res.response, 'pipelines');
    return pipelines ? { ...res, response: pipelines } : unreadableBody(res);
  }

  /**
   * Two reads for an enrich pipeline, one for every other kind. `view=compiled` resolves for `Enrich`
   * alone and the kind is not known until the declaration has been read, so the projection is chosen
   * from the first answer rather than guessed. A failed second read is reported rather than downgraded to
   * the first: the detail view renders `grain_key` and `version_column` as "not set" when they are
   * absent, which for an enrich pipeline would be a false statement rather than a missing one.
   *
   * The exception is a declaration the service cannot compile at all, which it answers 422 for. That is
   * an ordinary state now that a pipeline is registered before it is declared, and the authored
   * projection is the whole of what such a pipeline has — reporting the refusal instead would leave the
   * page the author has to finish the declaration on unreachable.
   */
  async getPipeline(name: string, token: Token): Promise<ServerActionResponse<Pipeline>> {
    const source = await this.getAction(PIPELINE_READ_URL(name, PipelineView.Source), token);

    if (!source.success) return source;
    if (!source.response) return unreadableBody(source);
    if ((source.response as Pipeline).kind !== PipelineKind.Enrich) return source;

    const compiled = await this.getAction(PIPELINE_READ_URL(name, PipelineView.Compiled), token);
    if (compiled.status === UNPROCESSABLE) return source;
    if (!compiled.success) return compiled;

    return compiled.response ? compiled : unreadableBody(compiled);
  }

  createPipeline(dto: CreatePipelineDto, token: Token): Promise<ServerActionResponse> {
    return this.postAction<CreatePipelineDto>(PIPELINES_URL, dto, token);
  }

  // A body carrying any declaration member re-declares the pipeline, which a running aggregate one
  // answers 409 for; `PipelineEnabledDto` is how the toggle stays a state change.
  updatePipeline(
    name: string,
    dto: CreatePipelineDto | PipelineEnabledDto,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.patchAction<CreatePipelineDto | PipelineEnabledDto>(PIPELINE_URL(name), dto, token);
  }

  deletePipeline(name: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(PIPELINE_URL(name), token);
  }
}
