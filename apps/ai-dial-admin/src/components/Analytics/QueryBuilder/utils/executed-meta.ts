import { getStrictNumericColumns } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { getResultColumns } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { DURATION_FIELD_TAG, FIELD_TYPE_VALUE_CLASS } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryExprType, QueryMode, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ExecutedQueryMeta,
  QueryRequestKind,
  QueryRunRequest,
  ResultColumnClassification,
  ResultValueClass,
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

// The tag narrows a class the type map already resolved as numeric; it never creates one. A
// Timestamp/Date field keeps DateTime however it is tagged, and a String/Enum/Uuid/Boolean field
// tagged `performance` stays unformatted — matching the tag before the type would let the tag create
// formatting the declared type refused.
const schemaValueClass = (field: AnalyticsEntityField): ResultValueClass | undefined => {
  const declared = FIELD_TYPE_VALUE_CLASS[field.type];
  const isUnitBearing = declared === ResultValueClass.Compact || declared === ResultValueClass.Significant;

  return isUnitBearing && field.tag === DURATION_FIELD_TAG ? ResultValueClass.Duration : declared;
};

// A column's rendering class, resolved in two steps: a column that names a schema field takes that
// field's declared class or nothing — a declared non-numeric type (Uuid, Enum, Boolean, String) is
// never overridden by its values. Only a measure column with no schema field at all is classified
// from its own values, using the same strict numeric parse `getStrictNumericColumns` used to decide
// it counted as a measure in the first place. Everything else gets no entry.
export const buildColumnValueClasses = (
  columns: string[],
  fields: AnalyticsEntityField[],
  measureColumns: string[],
  rows: ResultRows,
): Record<string, ResultValueClass> => {
  const classes: Record<string, ResultValueClass> = {};
  const candidates: string[] = [];

  for (const column of columns) {
    const field = fields.find((f) => f.name === column);
    if (field) {
      const declaredClass = schemaValueClass(field);
      if (declaredClass) classes[column] = declaredClass;
    } else if (measureColumns.includes(column)) {
      candidates.push(column);
    }
  }

  const numericCandidates = getStrictNumericColumns(rows, candidates);
  for (const column of numericCandidates) {
    const isWhole = rows.every((row) => Number.isInteger(Number(row[column])));
    classes[column] = isWhole ? ResultValueClass.Compact : ResultValueClass.Significant;
  }

  return classes;
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
        columnValueClasses: {},
      };
    }
    const dimensionColumns = resolveGroupByColumns(translated, resultColumns);
    const aggregateColumns = resultColumns.filter((c) => !dimensionColumns.includes(c));
    const isSameEntity = translated.entity === entityName;
    const measureColumns = translated.mode === QueryMode.Aggregate ? aggregateColumns : [];
    return {
      kind: request.kind,
      mode: translated.mode,
      dimensionColumns,
      aggregateColumns,
      columnLabels: isSameEntity ? buildColumnLabels(resultColumns, fields) : {},
      columnValueClasses: isSameEntity
        ? buildColumnValueClasses(resultColumns, fields, measureColumns, response.rows ?? [])
        : {},
    };
  }

  const dimensionColumns = request.query.group_by ?? [];
  const aggregateColumns = resultColumns.filter((c) => !dimensionColumns.includes(c));
  const measureColumns = request.query.mode === QueryMode.Aggregate ? aggregateColumns : [];
  return {
    kind: request.kind,
    mode: request.query.mode,
    dimensionColumns,
    aggregateColumns,
    columnLabels: buildColumnLabels(resultColumns, fields),
    columnValueClasses: buildColumnValueClasses(resultColumns, fields, measureColumns, response.rows ?? []),
  };
};
