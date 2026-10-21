import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsTable,
  AnalyticsTableType,
  Cardinality,
  PartitionGranularity,
  TableStatus,
} from '@/src/models/analytics/table';
import { ColumnRow } from '@/src/models/analytics/tables-ui';

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

  test('buildDto carries a column display name and description, and omits them when blank', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        {
          ...result.current.form.columns[0],
          source_name: 'total_tokens',
          name: 'total_tokens',
          type: AnalyticsFieldType.Long,
          display_name: 'Total tokens',
          description: 'Prompt plus completion tokens',
        },
        {
          ...result.current.form.columns[0],
          id: 'c2',
          source_name: 'ts',
          name: 'ts',
          type: AnalyticsFieldType.Timestamp,
        },
      ]),
    );
    act(() => result.current.update('orderingKey', ['ts']));

    expect(result.current.canMaterialize).toBe(true);
    expect(result.current.buildDto()).toEqual({
      columns: [
        {
          source_name: 'total_tokens',
          name: 'total_tokens',
          type: AnalyticsFieldType.Long,
          nullable: false,
          display_name: 'Total tokens',
          description: 'Prompt plus completion tokens',
        },
        { source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp, nullable: false },
      ],
      ordering_key: ['ts'],
    });
  });

  test('an over-cap display name or description blocks Materialize on an otherwise complete schema', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      ]),
    );
    act(() => result.current.update('orderingKey', ['ts']));
    expect(result.current.canMaterialize).toBe(true);

    act(() => result.current.update('columns', [{ ...result.current.form.columns[0], display_name: 'a'.repeat(129) }]));
    expect(result.current.canMaterialize).toBe(false);

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], display_name: '', description: 'b'.repeat(1025) },
      ]),
    );
    expect(result.current.canMaterialize).toBe(false);

    act(() => result.current.update('columns', [{ ...result.current.form.columns[0], description: '' }]));
    expect(result.current.canMaterialize).toBe(true);
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

describe('useDraftSchemaForm — key selections', () => {
  const setColumns = (result: { current: ReturnType<typeof useDraftSchemaForm> }, rows: Partial<ColumnRow>[]) =>
    act(() =>
      result.current.update(
        'columns',
        rows.map((r) => ({ ...createColumnRow(), ...r })),
      ),
    );

  test('each key select offers only the columns its backend rule accepts', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));
    setColumns(result, [
      { source_name: 'id', name: 'id', type: AnalyticsFieldType.Uuid },
      { source_name: 'maybe', name: 'maybe', type: AnalyticsFieldType.String, nullable: true },
      { source_name: 'payload', name: 'payload', type: AnalyticsFieldType.Object },
      { source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp },
      { source_name: 'closed_at', name: 'closed_at', type: AnalyticsFieldType.Timestamp, nullable: true },
    ]);

    expect(result.current.orderingOptions.map((o) => o.value)).toEqual(['id', 'seen_at']);
    expect(result.current.partitionNames).toEqual(['seen_at']);
  });

  test('a stale ordering key is never submitted, even when it bypassed the form update', () => {
    const stored: AnalyticsTable = {
      ...source,
      columns: [{ source_name: 'maybe', name: 'maybe', type: AnalyticsFieldType.String, nullable: true }],
      ordering_key: ['maybe'],
    };
    const { result } = renderHook(() => useDraftSchemaForm(stored, null, t));

    expect(result.current.canMaterialize).toBe(false);
    expect(result.current.buildDto()).not.toHaveProperty('ordering_key');
  });

  test('flipping a chosen ordering key column to nullable removes it from the selection', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));
    setColumns(result, [{ source_name: 'id', name: 'id', type: AnalyticsFieldType.Uuid }]);
    act(() => result.current.update('orderingKey', ['id']));

    act(() => result.current.update('columns', [{ ...result.current.form.columns[0], nullable: true }]));

    expect(result.current.form.orderingKey).toEqual([]);
  });

  test('renaming a column carries the ordering key and partition column to the new name', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));
    setColumns(result, [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }]);
    act(() => {
      result.current.update('orderingKey', ['seen_at']);
      result.current.update('partitionColumn', 'seen_at');
      result.current.update('granularity', PartitionGranularity.Month);
    });

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'seen_on', name: 'seen_on' },
      ]),
    );

    expect(result.current.form.orderingKey).toEqual(['seen_on']);
    expect(result.current.form.partitionColumn).toBe('seen_on');
    expect(result.current.form.granularity).toBe(PartitionGranularity.Month);
  });

  test('the Identity column is not offered as Version, and the Version column not as Identity', () => {
    const { result } = renderHook(() => useDraftSchemaForm(source, null, t));
    setColumns(result, [
      { source_name: 'id', name: 'id', type: AnalyticsFieldType.Uuid },
      { source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp },
      { source_name: 'saved_at', name: 'saved_at', type: AnalyticsFieldType.Timestamp },
    ]);

    act(() => result.current.update('identityColumn', 'seen_at'));
    expect(result.current.versionNames).toEqual(['saved_at']);
    expect(result.current.identityNames).toEqual(['id', 'seen_at', 'saved_at']);

    act(() => result.current.update('identityColumn', ''));
    expect(result.current.versionNames).toEqual(['seen_at', 'saved_at']);

    act(() => result.current.update('versionColumn', 'saved_at'));
    expect(result.current.identityNames).toEqual(['id', 'seen_at']);
  });
});

describe('useDraftSchemaForm enrichment grain key', () => {
  test('offers the source table columns except Object ones', () => {
    const src: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      status: TableStatus.Active,
      columns: [
        { source_name: 'id', name: 'id', type: AnalyticsFieldType.Uuid },
        { source_name: 'payload', name: 'payload', type: AnalyticsFieldType.Object },
      ],
    };
    const { result } = renderHook(() => useDraftSchemaForm(enrichment, src, t));

    expect(result.current.grainOptions).toEqual([{ value: 'id', label: 'id' }]);
  });
});

describe('useDraftSchemaForm — changed state', () => {
  test('reports unchanged on a fresh PENDING source', () => {
    const pendingSource: AnalyticsTable = { ...source, status: TableStatus.Pending };
    const { result } = renderHook(() => useDraftSchemaForm(pendingSource, null, t));

    expect(result.current.isChanged).toBe(false);
  });

  test('reports unchanged on a fresh PENDING enrichment', () => {
    const pendingEnrichment: AnalyticsTable = { ...enrichment, status: TableStatus.Pending };
    const { result } = renderHook(() => useDraftSchemaForm(pendingEnrichment, null, t));

    expect(result.current.isChanged).toBe(false);
  });

  test('reports unchanged on a FAILED table seeded from its stored columns, ordering key and scan pair', () => {
    const failedSource: AnalyticsTable = {
      ...source,
      status: TableStatus.Failed,
      columns: [
        { source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp },
        { source_name: 'order_id', name: 'order_id', type: AnalyticsFieldType.Uuid },
      ],
      ordering_key: ['seen_at'],
      identity_column: 'order_id',
      version_column: 'seen_at',
    };
    const { result } = renderHook(() => useDraftSchemaForm(failedSource, null, t));

    expect(result.current.isChanged).toBe(false);
  });

  test('reports changed once a valid column is set on a fresh source', () => {
    const pendingSource: AnalyticsTable = { ...source, status: TableStatus.Pending };
    const { result } = renderHook(() => useDraftSchemaForm(pendingSource, null, t));

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      ]),
    );

    expect(result.current.isChanged).toBe(true);
  });

  test('reports changed once an ordering key is set, even with the columns unchanged', () => {
    const storedSource: AnalyticsTable = {
      ...source,
      status: TableStatus.Failed,
      columns: [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }],
    };
    const { result } = renderHook(() => useDraftSchemaForm(storedSource, null, t));
    expect(result.current.isChanged).toBe(false);

    act(() => result.current.update('orderingKey', ['seen_at']));

    expect(result.current.isChanged).toBe(true);
  });

  test('reports changed once a grain key is set on a fresh enrichment', () => {
    const pendingEnrichment: AnalyticsTable = { ...enrichment, status: TableStatus.Pending };
    const { result } = renderHook(() => useDraftSchemaForm(pendingEnrichment, null, t));

    act(() => result.current.update('grainKey', 'order_id'));

    expect(result.current.isChanged).toBe(true);
  });

  test('reset returns isChanged to false and restores the form to the stored definition', () => {
    const storedSource: AnalyticsTable = {
      ...source,
      status: TableStatus.Failed,
      columns: [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }],
      ordering_key: ['seen_at'],
    };
    const { result } = renderHook(() => useDraftSchemaForm(storedSource, null, t));
    expect(result.current.isChanged).toBe(false);

    act(() =>
      result.current.update('columns', [
        ...result.current.form.columns,
        {
          ...result.current.form.columns[0],
          id: 'extra',
          source_name: 'order_id',
          name: 'order_id',
          type: AnalyticsFieldType.Uuid,
        },
      ]),
    );
    act(() => result.current.update('orderingKey', []));
    expect(result.current.isChanged).toBe(true);

    act(() => result.current.reset());

    expect(result.current.isChanged).toBe(false);
    expect(result.current.form.columns).toHaveLength(1);
    expect(result.current.form.columns[0].source_name).toBe('seen_at');
    expect(result.current.form.orderingKey).toEqual(['seen_at']);
  });

  test('baselineDto reflects the stored definition, unaffected by live form edits', () => {
    const storedSource: AnalyticsTable = {
      ...source,
      status: TableStatus.Failed,
      columns: [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }],
      ordering_key: ['seen_at'],
    };
    const { result } = renderHook(() => useDraftSchemaForm(storedSource, null, t));

    const initialBaseline = result.current.baselineDto;
    expect(initialBaseline).toEqual({
      columns: [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp, nullable: false }],
      ordering_key: ['seen_at'],
    });

    act(() =>
      result.current.update('columns', [
        { ...result.current.form.columns[0], source_name: 'renamed', name: 'renamed' },
      ]),
    );

    expect(result.current.baselineDto).toEqual(initialBaseline);
  });
});
