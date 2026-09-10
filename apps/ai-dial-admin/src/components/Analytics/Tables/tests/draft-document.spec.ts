import { describe, expect, test } from 'vitest';

import {
  buildDraftDocument,
  formatDraftDocument,
  splitDraftDocument,
} from '@/src/components/Analytics/Tables/draft-document';
import { buildDraftSchemaDto, createDraftSchemaForm } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsTable,
  AnalyticsTableType,
  Cardinality,
  DraftSchemaDto,
  DraftTableDocument,
  PartitionGranularity,
  TableStatus,
} from '@/src/models/analytics/table';

const columns = [{ source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp }];

describe('buildDraftDocument', () => {
  test("a source draft's document is its schema plus catalog metadata", () => {
    const table: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      description: 'Orders table',
      tag_order: ['pii'],
    };
    const schema: DraftSchemaDto = {
      columns,
      ordering_key: ['ts'],
      partition_by: { column: 'ts', granularity: PartitionGranularity.Day },
    };

    const document = buildDraftDocument(table, schema);

    expect(document).toEqual({
      columns,
      ordering_key: ['ts'],
      partition_by: { column: 'ts', granularity: PartitionGranularity.Day },
      description: 'Orders table',
      tag_order: ['pii'],
    });
    expect(document).not.toHaveProperty('identity_column');
    expect(document).not.toHaveProperty('version_column');
    expect(document).not.toHaveProperty('grain_key');
    expect(document).not.toHaveProperty('cardinality');
  });

  test("an enrichment draft's document is its schema plus catalog metadata", () => {
    const table: AnalyticsTable = { name: 'order_flags', type: AnalyticsTableType.Enrichment, source_table: 'orders' };
    const schema: DraftSchemaDto = { columns, grain_key: 'order_id', cardinality: Cardinality.ZeroOrOne };

    const document = buildDraftDocument(table, schema);

    // The table has neither stored value, so the seed falls back to an empty, still-editable pair.
    expect(document).toEqual({
      columns,
      grain_key: 'order_id',
      cardinality: Cardinality.ZeroOrOne,
      description: '',
      tag_order: [],
    });
    expect(document).not.toHaveProperty('ordering_key');
    expect(document).not.toHaveProperty('partition_by');
    expect(document).not.toHaveProperty('identity_column');
    expect(document).not.toHaveProperty('version_column');
  });
});

describe('buildDraftDocument — composed the way an ACTIVE table document is built (design.md D7)', () => {
  test("a source table's document is the write shape, not the GET response", () => {
    const table: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      status: TableStatus.Active,
      system: false,
      permissions: { write: true, modify: true },
      column_count: 2,
      description: 'Orders table',
      tag_order: ['pii'],
      columns: [
        { source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
        { source_name: 'id', name: 'id', type: AnalyticsFieldType.String },
      ],
      ordering_key: ['ts'],
      partition_by: { column: 'ts', granularity: PartitionGranularity.Day },
      identity_column: 'id',
      version_column: 'ts',
    };

    const document = buildDraftDocument(table, buildDraftSchemaDto(createDraftSchemaForm(table), table.type));

    expect(document).toEqual({
      columns: [
        { source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp, nullable: false },
        { source_name: 'id', name: 'id', type: AnalyticsFieldType.String, nullable: false },
      ],
      ordering_key: ['ts'],
      partition_by: { column: 'ts', granularity: PartitionGranularity.Day },
      identity_column: 'id',
      version_column: 'ts',
      description: 'Orders table',
      tag_order: ['pii'],
    });
    ['status', 'system', 'permissions', 'column_count', 'name', 'type', 'source_table', 'grain'].forEach((key) =>
      expect(document).not.toHaveProperty(key),
    );
  });

  test('a source table with no scan-metadata pair omits both identity_column and version_column', () => {
    const table: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      columns: [{ source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp }],
      ordering_key: ['ts'],
    };

    const document = buildDraftDocument(table, buildDraftSchemaDto(createDraftSchemaForm(table), table.type));

    expect(document).not.toHaveProperty('identity_column');
    expect(document).not.toHaveProperty('version_column');
  });

  test("an enrichment table's document carries its enrichment members and no source-only member", () => {
    const table: AnalyticsTable = {
      name: 'order_flags',
      type: AnalyticsTableType.Enrichment,
      status: TableStatus.Active,
      source_table: 'orders',
      description: 'Order flags',
      tag_order: ['finance'],
      columns: [{ source_name: 'flag', name: 'flag', type: AnalyticsFieldType.Boolean }],
      grain: { grain_key: 'order_id', cardinality: Cardinality.ZeroOrOne },
    };

    const document = buildDraftDocument(table, buildDraftSchemaDto(createDraftSchemaForm(table), table.type));

    expect(document).toEqual({
      columns: [{ source_name: 'flag', name: 'flag', type: AnalyticsFieldType.Boolean, nullable: false }],
      grain_key: 'order_id',
      cardinality: Cardinality.ZeroOrOne,
      description: 'Order flags',
      tag_order: ['finance'],
    });
    ['ordering_key', 'partition_by', 'identity_column', 'version_column', 'source_table', 'grain'].forEach((key) =>
      expect(document).not.toHaveProperty(key),
    );
  });

  test('a column renamed after materialization keeps both source_name and name and carries its stored metadata', () => {
    const table: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      columns: [
        {
          source_name: 'cust_id',
          name: 'customer_id',
          type: AnalyticsFieldType.String,
          tag: 'pii',
          display_name: 'Customer ID',
          description: 'Renamed after materialization',
          sensitive: true,
        },
      ],
    };

    const document = buildDraftDocument(table, buildDraftSchemaDto(createDraftSchemaForm(table), table.type));

    expect(document.columns).toEqual([
      {
        source_name: 'cust_id',
        name: 'customer_id',
        type: AnalyticsFieldType.String,
        nullable: false,
        tag: 'pii',
        display_name: 'Customer ID',
        description: 'Renamed after materialization',
        sensitive: true,
      },
    ]);
    expect(document.columns[0]).not.toHaveProperty('element_type');
    expect(document.columns[0]).not.toHaveProperty('enum_values');
  });

  test('formatDraftDocument renders the same 4-space JSON the JSON view displays', () => {
    const table: AnalyticsTable = {
      name: 'orders',
      type: AnalyticsTableType.Source,
      description: 'Orders table',
      tag_order: ['pii'],
      columns: [{ source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp }],
    };

    const document = buildDraftDocument(table, buildDraftSchemaDto(createDraftSchemaForm(table), table.type));

    expect(formatDraftDocument(document)).toBe(JSON.stringify(document, null, 4));
  });
});

describe('splitDraftDocument', () => {
  test('drops the seven read-only/identity members from the schema request', () => {
    const document = {
      columns,
      ordering_key: ['ts'],
      description: 'Orders table',
      tag_order: ['pii'],
      status: 'active',
      system: false,
      permissions: { write: true, modify: true },
      column_count: 3,
      name: 'orders',
      type: 'source',
      source_table: 'raw_orders',
    } as unknown as DraftTableDocument;

    const { schema } = splitDraftDocument(document);

    expect(schema).not.toHaveProperty('status');
    expect(schema).not.toHaveProperty('system');
    expect(schema).not.toHaveProperty('permissions');
    expect(schema).not.toHaveProperty('column_count');
    expect(schema).not.toHaveProperty('name');
    expect(schema).not.toHaveProperty('type');
    expect(schema).not.toHaveProperty('source_table');
    expect(schema).toEqual({ columns, ordering_key: ['ts'] });
  });

  test('routes description and tag_order into the update request and out of the schema request', () => {
    const document = { columns, description: 'Orders table', tag_order: ['pii'] } as DraftTableDocument;

    const { update, schema } = splitDraftDocument(document);

    expect(update).toEqual({ description: 'Orders table', tag_order: ['pii'] });
    expect(schema).not.toHaveProperty('description');
    expect(schema).not.toHaveProperty('tag_order');
  });

  test('unpacks a nested grain object into flat grain_key and cardinality members', () => {
    const document = {
      columns,
      grain: { grain_key: 'order_id', cardinality: Cardinality.ZeroOrOne },
    } as unknown as DraftTableDocument;

    const { schema } = splitDraftDocument(document);

    expect(schema).toEqual({ columns, grain_key: 'order_id', cardinality: Cardinality.ZeroOrOne });
    expect(schema).not.toHaveProperty('grain');
  });

  test('omits cardinality from the schema request when the nested grain object does not carry it', () => {
    const document = { columns, grain: { grain_key: 'order_id' } } as unknown as DraftTableDocument;

    const { schema } = splitDraftDocument(document);

    expect(schema).toEqual({ columns, grain_key: 'order_id' });
    expect(schema).not.toHaveProperty('cardinality');
  });

  test('a flat grain_key already present in the document wins over the nested grain object', () => {
    const document = {
      columns,
      grain_key: 'existing_flat',
      grain: { grain_key: 'nested', cardinality: Cardinality.ZeroOrOne },
    } as unknown as DraftTableDocument;

    const { schema } = splitDraftDocument(document);

    expect(schema).toMatchObject({ grain_key: 'existing_flat' });
  });

  test('passes an unrecognized member through to the schema request exactly as pasted', () => {
    const document = { columns, retention_days: 30 } as unknown as DraftTableDocument;

    const { schema } = splitDraftDocument(document);

    expect(schema).toMatchObject({ retention_days: 30 });
  });
});
