import { describe, expect, test } from 'vitest';

import { buildDraftDocument, splitDraftDocument } from '@/src/components/Analytics/Tables/draft-document';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsTable,
  AnalyticsTableType,
  Cardinality,
  DraftSchemaDto,
  DraftTableDocument,
  PartitionGranularity,
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
