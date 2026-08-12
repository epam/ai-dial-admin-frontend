import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, Cardinality, PartitionGranularity } from '@/src/models/analytics/table';

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

  test('retyping the selected partition column away from Date/Timestamp clears both it and the granularity', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      ]),
    );
    act(() => result.current.update('partitionColumn', 'ts'));
    act(() => result.current.update('granularity', PartitionGranularity.Month));
    expect(result.current.form.partitionColumn).toBe('ts');
    expect(result.current.form.granularity).toBe(PartitionGranularity.Month);

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Uuid },
      ]),
    );

    expect(result.current.form.partitionColumn).toBe('');
    expect(result.current.form.granularity).toBe('');
  });

  test('derives identity options from non-nullable, non-sensitive columns and version options from Timestamps', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
        },
        {
          ...result.current.form.columns[0],
          id: 'c2',
          source_name: 'order_id',
          name: 'order_id',
          type: AnalyticsFieldType.Uuid,
        },
        {
          ...result.current.form.columns[0],
          id: 'c3',
          source_name: 'closed_at',
          name: 'closed_at',
          type: AnalyticsFieldType.Timestamp,
          nullable: true,
        },
        {
          ...result.current.form.columns[0],
          id: 'c4',
          source_name: 'secret_at',
          name: 'secret_at',
          type: AnalyticsFieldType.Timestamp,
          sensitive: true,
        },
        {
          ...result.current.form.columns[0],
          id: 'c5',
          source_name: 'event_date',
          name: 'event_date',
          type: AnalyticsFieldType.Date,
        },
      ]),
    );

    expect(result.current.identityNames).toEqual(['seen_at', 'order_id', 'event_date']);
    // Date is offered for the partition column but never as a version — the backend requires a timestamp.
    expect(result.current.versionNames).toEqual(['seen_at']);
  });

  test('choosing exactly one scan-metadata member blocks Materialize until the other is set or cleared', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
        },
      ]),
    );
    act(() => result.current.update('orderingKey', ['seen_at']));
    expect(result.current.canMaterialize).toBe(true);
    expect(result.current.scanPairIncomplete).toBe(false);

    act(() => result.current.update('identityColumn', 'seen_at'));
    expect(result.current.scanPairIncomplete).toBe(true);
    expect(result.current.canMaterialize).toBe(false);

    act(() => result.current.update('versionColumn', 'seen_at'));
    expect(result.current.scanPairIncomplete).toBe(false);
    expect(result.current.canMaterialize).toBe(true);

    act(() => result.current.update('versionColumn', ''));
    expect(result.current.canMaterialize).toBe(false);
    act(() => result.current.update('identityColumn', ''));
    expect(result.current.canMaterialize).toBe(true);
  });

  test('buildDto carries both scan-metadata members when set and neither when unset', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
        },
      ]),
    );
    act(() => result.current.update('orderingKey', ['seen_at']));
    expect(result.current.buildDto()).not.toHaveProperty('identity_column');
    expect(result.current.buildDto()).not.toHaveProperty('version_column');

    act(() => result.current.update('identityColumn', 'seen_at'));
    act(() => result.current.update('versionColumn', 'seen_at'));
    expect(result.current.buildDto()).toMatchObject({ identity_column: 'seen_at', version_column: 'seen_at' });
  });

  test('a scan-metadata selection clears when its column stops qualifying', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
        },
      ]),
    );
    act(() => result.current.update('identityColumn', 'seen_at'));
    act(() => result.current.update('versionColumn', 'seen_at'));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
          sensitive: true,
        },
      ]),
    );

    expect(result.current.form.identityColumn).toBe('');
    expect(result.current.form.versionColumn).toBe('');
  });

  test('a stored pair makes both members required, since a re-post cannot clear one', () => {
    const stored: AnalyticsTable = { ...source, identity_column: 'order_id', version_column: 'seen_at' };
    const { result } = renderHook(() => useDraftSchemaForm(stored, null, t));

    expect(result.current.form.identityColumn).toBe('order_id');
    expect(result.current.form.versionColumn).toBe('seen_at');
    expect(result.current.scanPairRequired).toBe(true);

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'seen_at',
          name: 'seen_at',
          type: AnalyticsFieldType.Timestamp,
        },
      ]),
    );
    act(() => result.current.update('orderingKey', ['seen_at']));

    // `order_id` was dropped from the columns, so its selection cleared — and an empty pair is not
    // acceptable here because the stored value would survive the re-post.
    expect(result.current.form.identityColumn).toBe('');
    expect(result.current.scanPairIncomplete).toBe(true);
    expect(result.current.canMaterialize).toBe(false);
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
  test('never emits either scan-metadata member, even with both chosen in the form', () => {
    const { result } = renderHook(() => useDraftSchemaForm(enrichment, null, t));

    act(() => result.current.update('grainKey', 'order_id'));
    act(() => result.current.update('identityColumn', 'order_id'));
    act(() => result.current.update('versionColumn', 'seen_at'));

    expect(result.current.buildDto()).not.toHaveProperty('identity_column');
    expect(result.current.buildDto()).not.toHaveProperty('version_column');
    // The all-or-nothing gate is source-only, so it never blocks an enrichment.
    expect(result.current.scanPairIncomplete).toBe(false);
    expect(result.current.canMaterialize).toBe(true);
  });

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
