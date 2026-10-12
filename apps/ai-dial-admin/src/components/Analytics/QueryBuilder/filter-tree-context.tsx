'use client';

import { createContext, useContext } from 'react';

import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';

// The tree is edited in place, so every edit ends by asking the owner to re-render through `refresh`.
export interface FilterTreeContextValue {
  fields: AnalyticsEntityField[];
  functions: QueryFunction[];
  refresh: () => void;
}

export const FilterTreeContext = createContext<FilterTreeContextValue | null>(null);

// Inside the Query Builder nothing provides `FilterTreeContext`; the value comes from the builder's own
// context, so its sections need no wrapper.
export const useFilterTree = (): FilterTreeContextValue => {
  const own = useContext(FilterTreeContext);
  const builder = useContext(QueryBuilderContext);

  if (own) return own;
  if (!builder) throw new Error('useFilterTree must be used within FilterTreeContext or QueryBuilderContext');

  return { fields: builder.state.fields, functions: builder.state.functions, refresh: builder.refresh };
};
