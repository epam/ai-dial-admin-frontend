import { mcpToolCallFilter } from '@/src/components/Analytics/Usage/queries';
import { buildEntityScope } from '@/src/components/Analytics/Usage/utils/entity-scope';
import { USAGE_LOG_ENTITY } from '@/src/constants/analytics/sessions-trace';
import { EntityTraceCursor } from '@/src/models/analytics/entity-traces';
import {
  QueryFilterNode,
  QueryOperator,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { SessionTraceWindow, UsageLogField } from '@/src/models/analytics/sessions-trace';
import { ApplicationRoute } from '@/src/types/routes';
import {
  and,
  col,
  eq,
  field,
  le,
  ge,
  offsetPage,
  or,
  predicate,
  rowQuery,
  sortItem,
  value,
} from '@/src/utils/analytics/query-build';
import { isToolsetRoute } from '@/src/utils/is-view';

// The card's call tier, read straight off the call's own row.
const CALL_FIELDS: string[] = [
  UsageLogField.TraceId,
  UsageLogField.CoreSpanId,
  UsageLogField.RequestTime,
  UsageLogField.OperationDurationMs,
  UsageLogField.Success,
  UsageLogField.ResponseStatus,
  UsageLogField.TotalTokens,
  UsageLogField.TotalPrice,
  UsageLogField.DeploymentPrice,
  UsageLogField.RequestUri,
  UsageLogField.EventKind,
  UsageLogField.NumberRequestMessages,
  UsageLogField.Deployment,
  UsageLogField.ParentDeployment,
  UsageLogField.ProjectId,
];

const text = (val: string) => value(QueryValueType.String, val);
const timestamp = (ms: number) => value(QueryValueType.Timestamp, String(ms));

/**
 * The rows that are calls *to* the entity named as the log records it (`getEntityDeploymentName`), or null
 * where it has no such name — an empty clause list would read every call in the log under the entity's heading.
 *
 * A toolset's rows are narrowed to tool calls: connection handshakes, tool listings and notifications are most
 * of its traffic and say nothing about its use. The filter is the usage MCP view's own, so the two cannot drift.
 */
export const entityCallClauses = (route: ApplicationRoute, name: string | null): QueryFilterNode[] | null => {
  const own = buildEntityScope(route, name)?.own;

  if (!own) {
    return null;
  }

  return isToolsetRoute(route) ? [...own, mcpToolCallFilter()] : own;
};

// Strictly after the last call shown, in the listing's own order. A plain row predicate is enough because the
// unit is a row: no aggregate is computed over the rows the cursor excludes, so no call's start time can move.
const afterCursor = ({ requestTime, coreSpanId }: EntityTraceCursor): QueryFilterNode =>
  or([
    predicate(QueryOperator.Lt, UsageLogField.RequestTime, timestamp(requestTime)),
    and([
      eq(UsageLogField.RequestTime, timestamp(requestTime)),
      predicate(QueryOperator.Lt, UsageLogField.CoreSpanId, text(coreSpanId)),
    ]),
  ]);

/**
 * One page of calls to an entity, newest first. Paged by keyset rather than offset: calls keep arriving while
 * the listing is open, and under a newest-first order each new call would shift every offset by one.
 */
export const buildEntityCallPageQuery = (
  clauses: QueryFilterNode[],
  range: SessionTraceWindow,
  limit: number,
  cursor: EntityTraceCursor | null = null,
): StructuredQuery =>
  rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: CALL_FIELDS.map((fieldName) => col(field(fieldName))),
    filter: and([
      ...clauses,
      ge(UsageLogField.RequestTime, timestamp(range.fromMs)),
      le(UsageLogField.RequestTime, timestamp(range.toMs)),
      ...(cursor ? [afterCursor(cursor)] : []),
    ]),
    sort: [
      sortItem(UsageLogField.RequestTime, QuerySortDirection.Desc),
      sortItem(UsageLogField.CoreSpanId, QuerySortDirection.Desc),
    ],
    page: offsetPage(0, limit),
  });
