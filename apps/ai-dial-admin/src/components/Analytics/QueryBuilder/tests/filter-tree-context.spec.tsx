import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { QueryBuilderContext, QueryBuilderContextValue } from '@/src/components/Analytics/QueryBuilder/context';
import {
  FilterTreeContext,
  FilterTreeContextValue,
  useFilterTree,
} from '@/src/components/Analytics/QueryBuilder/filter-tree-context';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';

const fields = [{ name: 'a', type: AnalyticsFieldType.String, source: 't' }] as AnalyticsEntityField[];
const functions = [{ name: 'now' }] as QueryFunction[];

describe('useFilterTree', () => {
  test('returns the value an owner outside the Query Builder provides', () => {
    const own: FilterTreeContextValue = { fields, functions: [], refresh: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FilterTreeContext.Provider value={own}>{children}</FilterTreeContext.Provider>
    );

    const { result } = renderHook(() => useFilterTree(), { wrapper });

    expect(result.current).toBe(own);
  });

  test('derives the same three members from the Query Builder context when nothing is provided', () => {
    const refresh = vi.fn();
    const builder = { state: { fields, functions }, refresh, patch: vi.fn() } as unknown as QueryBuilderContextValue;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryBuilderContext.Provider value={builder}>{children}</QueryBuilderContext.Provider>
    );

    const { result } = renderHook(() => useFilterTree(), { wrapper });

    expect(result.current).toEqual({ fields, functions, refresh });
  });

  test('prefers the provided value over the Query Builder context', () => {
    const own: FilterTreeContextValue = { fields: [], functions: [], refresh: vi.fn() };
    const builder = {
      state: { fields, functions },
      refresh: vi.fn(),
      patch: vi.fn(),
    } as unknown as QueryBuilderContextValue;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryBuilderContext.Provider value={builder}>
        <FilterTreeContext.Provider value={own}>{children}</FilterTreeContext.Provider>
      </QueryBuilderContext.Provider>
    );

    const { result } = renderHook(() => useFilterTree(), { wrapper });

    expect(result.current).toBe(own);
  });

  test('throws outside both contexts', () => {
    expect(() => renderHook(() => useFilterTree())).toThrow(/within FilterTreeContext or QueryBuilderContext/);
  });
});
