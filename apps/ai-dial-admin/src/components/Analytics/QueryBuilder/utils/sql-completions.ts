import { SQL_FUNCTIONS, SQL_KEYWORDS } from '@/src/constants/analytics/sql';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SqlCompletion, SqlCompletionKind } from '@/src/models/analytics/sql';

// Build the SQL editor's completion suggestions from the loaded schema and the fixed SQL catalog:
// one item per schema field (with its type as detail), the selected entity name (the FROM target),
// and the supported keywords + functions. Pure and Monaco-free so it can be unit-tested directly;
// the provider maps these descriptors to real Monaco completion items.
export const buildSqlCompletions = (fields: AnalyticsEntityField[], entityName: string): SqlCompletion[] => {
  const fieldItems: SqlCompletion[] = fields.map((f) => ({
    label: f.name,
    kind: SqlCompletionKind.Field,
    insertText: f.name,
    detail: f.type,
  }));

  const entityItems: SqlCompletion[] = entityName
    ? [{ label: entityName, kind: SqlCompletionKind.Entity, insertText: entityName, detail: 'table' }]
    : [];

  const keywordItems: SqlCompletion[] = SQL_KEYWORDS.map((kw) => ({
    label: kw,
    kind: SqlCompletionKind.Keyword,
    insertText: kw,
    detail: 'keyword',
  }));

  const functionItems: SqlCompletion[] = SQL_FUNCTIONS.map((fn) => ({
    label: fn,
    kind: SqlCompletionKind.Function,
    insertText: fn,
    detail: 'function',
  }));

  return [...fieldItems, ...entityItems, ...keywordItems, ...functionItems];
};
