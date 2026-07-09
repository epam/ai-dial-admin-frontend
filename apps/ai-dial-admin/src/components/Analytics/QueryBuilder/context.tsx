'use client';

import { createContext, useContext } from 'react';

import { QueryBuilderState } from '@/src/models/analytics/query-builder';

export interface QueryBuilderContextValue {
  state: QueryBuilderState;
  refresh: () => void;
  patch: (partial: Partial<QueryBuilderState>) => void;
}

export const QueryBuilderContext = createContext<QueryBuilderContextValue | null>(null);

export const useQueryBuilder = (): QueryBuilderContextValue => {
  const ctx = useContext(QueryBuilderContext);
  if (!ctx) throw new Error('useQueryBuilder must be used within QueryBuilderContext');
  return ctx;
};
