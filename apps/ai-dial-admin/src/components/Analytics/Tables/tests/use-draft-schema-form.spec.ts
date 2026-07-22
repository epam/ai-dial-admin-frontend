import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, Cardinality } from '@/src/models/analytics/table';

const t = (key: string) => key;

const source: AnalyticsTable = { name: 'orders', type: AnalyticsTableType.Source };
const enrichment: AnalyticsTable = { name: 'order_flags', type: AnalyticsTableType.Enrichment, source_table: 'orders' };

describe('useDraftSchemaForm source', () => {
  test('starts with one empty column row and Materialize disabled', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));
    expect(result.current.form.columns).toHaveLength(1);
    expect(result.current.canMaterialize).toBe(false);
  });

  test('Materialize enables once a valid column and its ordering key are set', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      ]),
    );
    expect(result.current.canMaterialize).toBe(false); // no ordering key yet

    act(() => result.current.update('orderingKey', ['ts']));
    expect(result.current.canMaterialize).toBe(true);
  });

  test('buildDto includes only the ordering-key entries backed by a declared column', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      ]),
    );
    act(() => result.current.update('orderingKey', ['ts', 'unknown_column']));

    expect(result.current.buildDto()).toEqual({
      columns: [{ source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp, nullable: false }],
      ordering_key: ['ts'],
    });
  });

  test('an invalid column row keeps Materialize disabled regardless of the ordering key', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'Bad Name', name: 'ts', type: AnalyticsFieldType.String },
      ]),
    );
    act(() => result.current.update('orderingKey', ['Bad Name']));

    expect(result.current.canMaterialize).toBe(false);
  });
});

describe('useDraftSchemaForm enrichment', () => {
  test('Materialize is disabled without a grain key and enables once one is set', () => {
    const { result } = renderHook(() => useDraftSchemaForm(enrichment, null, t));
    expect(result.current.canMaterialize).toBe(false);

    act(() => result.current.update('grainKey', 'order_id'));
    expect(result.current.canMaterialize).toBe(true);
  });

  test('grain-key options come from the referenced source table, not the draft columns', () => {
    const sourceWithColumns: AnalyticsTable = {
      ...source,
      columns: [{ source_name: 'order_id', name: 'order_id', type: AnalyticsFieldType.Uuid }],
    };
    const { result } = renderHook(() => useDraftSchemaForm(enrichment, sourceWithColumns, t));
    expect(result.current.grainOptions).toEqual([{ value: 'order_id', label: 'order_id' }]);
  });

  test('buildDto always carries the hardcoded zero_or_one cardinality', () => {
    const { result } = renderHook(() => useDraftSchemaForm(enrichment, null, t));
    act(() => result.current.update('grainKey', 'order_id'));

    expect(result.current.buildDto()).toEqual({
      columns: [],
      grain_key: 'order_id',
      cardinality: Cardinality.ZeroOrOne,
    });
  });
});
