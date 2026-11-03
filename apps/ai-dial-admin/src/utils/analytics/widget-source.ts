import { omit } from 'lodash';

import {
  DashboardWidget,
  WidgetInlineQuery,
  WidgetQuery,
  WidgetQueryKind,
  WidgetQuerySource,
} from '@/src/models/analytics/dashboard';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';

const INLINE_KEY_PREFIX = 'inline:';

/** The key a widget's resolved query is held under: its saved query's id, or its own id for an inline query. */
export const getWidgetQueryKey = ({ id, saved_query_id }: Pick<DashboardWidget, 'id' | 'saved_query_id'>): string =>
  saved_query_id ?? `${INLINE_KEY_PREFIX}${id}`;

// One body only — SQL when there is any, since that is what Edit settings edits and a structured body would win
// when the widget runs.
const toInlineBody = ({ query, sql }: WidgetQuerySource): Pick<WidgetInlineQuery, 'query' | 'sql'> => {
  if (sql) return { sql };
  return query ? { query } : {};
};

/** The query a resolved widget query was made from; none for one that is unavailable or failed to resolve. */
export const getWidgetQuerySource = (widgetQuery?: WidgetQuery): WidgetQuerySource | null => {
  if (widgetQuery?.kind === WidgetQueryKind.Structured || widgetQuery?.kind === WidgetQueryKind.CompositeSql) {
    return widgetQuery.savedQuery;
  }
  return null;
};

/** A query as a widget holds it inline: the body, the view it is drawn in and its chart, nothing else. */
export const toInlineQuery = (source: WidgetQuerySource): WidgetInlineQuery => ({
  name: source.name,
  ...toInlineBody(source),
  result_view: source.result_view ?? QueryResultView.Table,
  ...(source.chart ? { chart: source.chart } : {}),
});

/** A SQL statement typed into Add widget, named by the widget's own title. */
export const toSqlInlineQuery = (name: string, sql: string): WidgetInlineQuery => ({
  name,
  sql,
  result_view: QueryResultView.Table,
});

/** A query's body as its preview shows it: the SQL statement, or the structured body as JSON. */
export const formatQueryPreview = ({ sql, query }: Pick<WidgetQuerySource, 'sql' | 'query'>): string =>
  sql ?? (query ? JSON.stringify(query, null, 2) : '');

export interface CopiedPersonalQueries {
  widgets: DashboardWidget[];
  // The resolved queries with an entry under each copied widget's new key.
  queries: Record<string, WidgetQuery>;
  // Each personal query copied, once, in widget order.
  copiedNames: string[];
}

export const hasUnresolvedSavedQueries = (widgets: DashboardWidget[], queries: Record<string, WidgetQuery>): boolean =>
  widgets.some(
    (widget) =>
      widget.saved_query_id != null &&
      (queries[widget.saved_query_id] == null || queries[widget.saved_query_id].kind === WidgetQueryKind.Failed),
  );

/**
 * Turns every widget on a personal saved query into an inline copy of it, so viewers who cannot read the
 * personal query can still run the widget. An untitled widget takes the query's name, which would otherwise
 * be lost with the reference. Widgets on common queries keep their reference.
 */
export const copyPersonalQueries = (
  widgets: DashboardWidget[],
  queries: Record<string, WidgetQuery>,
): CopiedPersonalQueries => {
  const copiedNames = new Set<string>();
  const nextQueries = { ...queries };

  const nextWidgets = widgets.map((widget) => {
    const resolved = widget.saved_query_id ? queries[widget.saved_query_id] : undefined;
    if (resolved?.kind !== WidgetQueryKind.Structured && resolved?.kind !== WidgetQueryKind.CompositeSql) return widget;
    if (resolved.savedQuery.scope !== SavedQueryScope.Personal) return widget;

    const inlineQuery = toInlineQuery(resolved.savedQuery);
    const copy: DashboardWidget = {
      ...omit(widget, 'saved_query_id'),
      title: widget.title || inlineQuery.name,
      inline_query: inlineQuery,
    };
    copiedNames.add(inlineQuery.name);
    nextQueries[getWidgetQueryKey(copy)] = { ...resolved, savedQuery: inlineQuery };
    return copy;
  });

  return { widgets: nextWidgets, queries: nextQueries, copiedNames: [...copiedNames] };
};
