import {
  QueryScopeFilter,
  QueryTree,
  SourceTable,
  TableColumnTree,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { USAGE_LOG_ENTITY } from '@/src/constants/analytics/sessions-trace';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { ApplicationRoute } from '@/src/types/routes';

const SCOPE_BY_FILTER: Record<QueryScopeFilter, SavedQueryScope | null> = {
  [QueryScopeFilter.All]: null,
  [QueryScopeFilter.Personal]: SavedQueryScope.Personal,
  [QueryScopeFilter.Common]: SavedQueryScope.Common,
};

const includesTerm = (value: string | undefined, term: string): boolean =>
  !!value && value.toLowerCase().includes(term);

export const toSourceTables = (entities: AnalyticsEntity[], tables: AnalyticsTable[]): SourceTable[] => {
  const catalog = new Map(tables.map((table) => [table.name, table]));

  return entities.map(({ name }) => {
    const table = catalog.get(name);
    return { name, description: table?.description, tagOrder: table?.tag_order };
  });
};

export const filterSourceTables = (tables: SourceTable[], search: string): SourceTable[] => {
  const term = search.trim().toLowerCase();
  return term ? tables.filter((table) => includesTerm(table.name, term)) : tables;
};

export const filterSavedQueries = (
  queries: SavedQuery[],
  search: string,
  scopeFilter: QueryScopeFilter,
): SavedQuery[] => {
  const term = search.trim().toLowerCase();
  const scope = SCOPE_BY_FILTER[scopeFilter];

  return queries
    .filter((query) => !scope || query.scope === scope)
    .filter((query) => !term || includesTerm(query.name, term) || includesTerm(query.tag, term))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
};

export const groupColumnsByTag = (fields: AnalyticsEntityField[], tagOrder: string[] = []): TableColumnTree => {
  const byTag = new Map<string, AnalyticsEntityField[]>();
  const untagged: AnalyticsEntityField[] = [];

  fields.forEach((field) => {
    if (!field.tag) {
      untagged.push(field);
      return;
    }
    const bucket = byTag.get(field.tag);
    if (bucket) bucket.push(field);
    else byTag.set(field.tag, [field]);
  });

  const ordered = tagOrder.filter((tag) => byTag.has(tag));
  const rest = [...byTag.keys()].filter((tag) => !ordered.includes(tag));

  return {
    groups: [...ordered, ...rest].map((tag) => ({ tag, fields: byTag.get(tag) ?? [] })),
    untagged,
  };
};

export const resolveDraftTable = (entities: AnalyticsEntity[], requested?: string): string => {
  const find = (name?: string) => entities.find((entity) => entity.name === name)?.name;
  return find(requested) ?? find(USAGE_LOG_ENTITY) ?? entities[0]?.name ?? '';
};

export const getDraftHref = (locale: string): string => `/${locale}${ApplicationRoute.AnalyticsQueries}`;

export const getGroupKey = (table: string, tag: string): string => `${table}:${tag}`;

export const getQueryGroupKey = (tag: string): string => `query-tag:${tag}`;

export const groupQueriesByTag = (queries: SavedQuery[]): QueryTree => {
  const byTag = new Map<string, SavedQuery[]>();
  const untagged: SavedQuery[] = [];

  queries.forEach((query) => {
    const tag = query.tag?.trim();
    if (!tag) {
      untagged.push(query);
      return;
    }
    const bucket = byTag.get(tag);
    if (bucket) bucket.push(query);
    else byTag.set(tag, [query]);
  });

  const groups = [...byTag.entries()]
    .map(([tag, grouped]) => ({ tag, queries: grouped }))
    .sort((a, b) => a.tag.localeCompare(b.tag, undefined, { sensitivity: 'base' }));

  return { groups, untagged };
};
