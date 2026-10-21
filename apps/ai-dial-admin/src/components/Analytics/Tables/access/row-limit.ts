import { escapeRegExp } from 'lodash';
import type { editor, IRange } from 'monaco-editor';

import { serializeNode } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFilterNode } from '@/src/models/analytics/query';
import { FilterNode, FilterNodeKind } from '@/src/models/analytics/query-builder';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

// The table's own stored columns as the filter editor's fields — sensitive ones included, because the
// service validates a row policy against what the table stores, not against what the viewer sees.
export const columnsToFields = (tableName: string, columns: AnalyticsTableColumn[]): AnalyticsEntityField[] =>
  columns.map((column) => ({
    name: column.name,
    type: column.type,
    enum_values: column.enum_values,
    source: tableName,
    tag: column.tag,
    display_name: column.display_name,
    description: column.description,
    sensitive: column.sensitive,
  }));

// Only the shape is checked here; the service judges the rest.
export const parseFilterJson = (text: string): QueryFilterNode | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;

    const { op, args } = parsed as { op?: unknown; args?: unknown };

    return typeof op === 'string' && Array.isArray(args) ? (parsed as QueryFilterNode) : null;
  } catch {
    return null;
  }
};

// The lines of a filter's JSON that name a field, so the one the service refused can be marked. Matched as a
// pattern, because JSON typed by hand has no fixed spacing around the colon.
export const findFieldMatches = (model: editor.ITextModel, field: string): IRange[] =>
  model
    .findMatches(`"name"\\s*:\\s*"${escapeRegExp(field)}"`, false, true, false, null, false)
    .map((match) => match.range);

// The service names the offending field in the text of a 422; only a field the filter really uses can be marked.
export const findNamedField = (message: string | undefined, filter: QueryFilterNode | null): string | null => {
  if (!message || !filter) return null;

  const json = JSON.stringify(filter);

  return (message.match(/[A-Za-z_][\w.]*/g) ?? []).find((word) => json.includes(`"name":"${word}"`)) ?? null;
};

// Serialization skips a condition with no column and a group with no members. For a row limit that widens
// what the role reads, so such a tree is not storable as shown. The root may be empty: there is then nothing
// to store at all.
export const hasUnfinishedCondition = (node: FilterNode, isRoot = true): boolean => {
  if (node.kind === FilterNodeKind.Predicate) return serializeNode(node, []) === null;
  if (!node.children.length) return !isRoot;

  return node.children.some((child) => hasUnfinishedCondition(child, false));
};
