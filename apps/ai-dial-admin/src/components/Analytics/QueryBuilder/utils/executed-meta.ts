import { getStrictNumericColumns } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { getResultColumns } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryExprType, QueryMode, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ExecutedQueryMeta,
  QueryRequestKind,
  QueryRunRequest,
  ResultColumnClassification,
} from '@/src/models/analytics/query-builder';

type ResultRows = Array<Record<string, unknown>>;

// `translate-sql` names a group-by entry by the column the query groups on, which is not always the
// name the result rows are keyed by: a plain column selected under an alias comes back under its
// underlying name while the rows carry the alias. `resultColumns` settles it — an entry that already
// names a returned column is that column, and only an entry that names none is looked up among the
// aliases. An entry matching neither is dropped rather than offered as an axis nothing can plot.
export const resolveGroupByColumns = (query: StructuredQuery, resultColumns: string[]): string[] => {
  const groupBy = query.group_by ?? [];
  const select = query.select ?? [];
  return groupBy
    .map((column) => {
      if (resultColumns.includes(column)) return column;
      const aliased = select.find(
        (item) => item.expr.type === QueryExprType.Field && item.expr.name === column && !!item.as,
      );
      return aliased?.as ?? column;
    })
    .filter((column) => resultColumns.includes(column));
};

// Classification for a SQL run the backend could not translate: with no query semantics, the client
// cannot tell a dimension from a measure, so every column is offered as a dimension and the user
// picks. Only columns that are numbers throughout can carry a value — so a numeric column that is
// semantically a dimension appears in both lists, which is accepted rather than guessed at.
export const classifyResultColumns = (columns: string[], rows: ResultRows): ResultColumnClassification => ({
  dimensionColumns: columns,
  aggregateColumns: getStrictNumericColumns(rows, columns),
});

// A returned column that names a schema field is labeled by that field's display name; anything else
// — a computed column, named by its alias — keeps the name it came back with.
export const buildColumnLabels = (columns: string[], fields: AnalyticsEntityField[]): Record<string, string> => {
  const labels: Record<string, string> = {};
  for (const column of columns) {
    const displayName = fields.find((f) => f.name === column)?.display_name;
    if (displayName) labels[column] = displayName;
  }
  return labels;
};

export const buildExecutedMeta = (
  request: QueryRunRequest,
  response: StructuredQueryResult,
  fields: AnalyticsEntityField[],
  entityName: string,
  translated: StructuredQuery | null = null,
): ExecutedQueryMeta => {
  const resultColumns = getResultColumns(response)
    .map((c) => c.field)
    .filter((c): c is string => !!c);

  if (request.kind === QueryRequestKind.Sql) {
    if (!translated) {
      return {
        kind: request.kind,
        mode: QueryMode.Row,
        ...classifyResultColumns(resultColumns, response.rows ?? []),
        columnLabels: {},
      };
    }
    const dimensionColumns = resolveGroupByColumns(translated, resultColumns);
    return {
      kind: request.kind,
      mode: translated.mode,
      dimensionColumns,
      aggregateColumns: resultColumns.filter((c) => !dimensionColumns.includes(c)),
      columnLabels: translated.entity === entityName ? buildColumnLabels(resultColumns, fields) : {},
    };
  }

  const dimensionColumns = request.query.group_by ?? [];
  return {
    kind: request.kind,
    mode: request.query.mode,
    dimensionColumns,
    aggregateColumns: resultColumns.filter((c) => !dimensionColumns.includes(c)),
    columnLabels: buildColumnLabels(resultColumns, fields),
  };
};
