import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import { ConversationsField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import {
  buildConversationColumnCatalog,
  offerableSchemaFields,
  catalogFilterableFields,
  catalogSortableFields,
  catalogValueTypes,
  projectableSchemaFields,
} from '@/src/utils/analytics/conversation-column-catalog';

const CURATED: ColDef[] = [
  { field: ConversationsField.ChatId, headerName: 'Conversation' },
  { field: ConversationsField.LastRequestTime, headerName: 'Activity', filter: false },
  { field: 'rating', headerName: 'Rating', sortable: false, filter: false },
];

// A plain column of the entity's own source reports its flat name as the field backing it, so the factory
// mirrors that: `source` follows `name` unless a case overrides it to model an enrichment-supplied field.
const field = (overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField => {
  const name = overrides.name ?? 'success_count';
  return { name, type: AnalyticsFieldType.Integer, source: name, ...overrides };
};

const enrichmentField = (name: string, overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField =>
  field({ name, source: name.split('.').at(-1) as string, ...overrides });

const catalogFields = (fields: AnalyticsEntityField[]): string[] =>
  buildConversationColumnCatalog(CURATED, fields).map((column) => column.field as string);

describe('buildConversationColumnCatalog', () => {
  test('keeps the curated columns first and unchanged', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [field()]);

    expect(catalog.slice(0, CURATED.length)).toEqual(CURATED);
  });

  test('appends a schema field as a hidden column', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [field()]);
    const added = catalog.at(-1);

    expect(added).toMatchObject({ field: 'success_count', hide: true });
  });

  test('prefers the display name the service reports', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [field({ display_name: 'Successful calls' })]);

    expect(catalog.at(-1)?.headerName).toBe('Successful calls');
  });

  test('falls back to the field name when no display name is reported', () => {
    expect(buildConversationColumnCatalog(CURATED, [field()]).at(-1)?.headerName).toBe('success_count');
  });

  test('carries the description as the header tooltip', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [field({ description: 'How many succeeded' })]);

    expect(catalog.at(-1)?.headerTooltip).toBe('How many succeeded');
  });

  test('does not offer a sensitive field', () => {
    expect(catalogFields([field({ sensitive: true })])).not.toContain('success_count');
  });

  // The service omits a heavy field from a wildcard projection because it is expensive to transfer, and an
  // offered column is one the view may project on every page.
  test('does not offer a heavy field', () => {
    expect(catalogFields([field({ heavy: true })])).not.toContain('success_count');
  });

  test.each([[AnalyticsFieldType.Object], [AnalyticsFieldType.Array]])('does not offer a %s field', (type) => {
    expect(catalogFields([field({ name: 'payload', type })])).not.toContain('payload');
  });

  test('does not offer a field a curated column already binds to', () => {
    const names = catalogFields([field({ name: ConversationsField.ChatId, type: AnalyticsFieldType.String })]);

    expect(names.filter((name) => name === ConversationsField.ChatId)).toHaveLength(1);
  });

  test('does not offer a field a curated column composes from', () => {
    expect(
      catalogFields([field({ name: ConversationsField.FirstRequestTime, type: AnalyticsFieldType.Timestamp })]),
    ).not.toContain(ConversationsField.FirstRequestTime);
  });

  test('offers a text filter for a string field', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [
      field({ name: 'topic', type: AnalyticsFieldType.String }),
    ]);

    expect(catalog.at(-1)?.filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
  });

  test.each([[AnalyticsFieldType.Integer], [AnalyticsFieldType.Long], [AnalyticsFieldType.Decimal]])(
    'offers a number filter for a %s field',
    (type) => {
      const catalog = buildConversationColumnCatalog(CURATED, [field({ name: 'measure', type })]);

      expect(catalog.at(-1)?.filter).toBe(baseNumberFilter.filter);
      expect(catalog.at(-1)?.cellClass).toBe('align-right');
    },
  );

  test.each([[AnalyticsFieldType.Timestamp], [AnalyticsFieldType.Date]])(
    'formats a %s field and gives it the date filter',
    (type) => {
      const catalog = buildConversationColumnCatalog(CURATED, [field({ name: 'created_at', type })]);
      const added = catalog.at(-1);

      expect(added?.valueFormatter).toBeTypeOf('function');
      expect(added?.filter).toBe('agDateColumnFilter');
      expect(added?.filterParams?.filterOptions).not.toContain('contains');
    },
  );

  test('formats a numeric field', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [field({ name: 'measure' })]);

    expect(catalog.at(-1)?.valueFormatter).toBeTypeOf('function');
  });

  test('offers a text filter for a type it does not recognise as numeric', () => {
    const catalog = buildConversationColumnCatalog(CURATED, [
      field({ name: 'flag', type: AnalyticsFieldType.Boolean }),
    ]);

    expect(catalog.at(-1)?.filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
  });

  test('returns the curated columns alone when the schema is unavailable', () => {
    expect(buildConversationColumnCatalog(CURATED)).toEqual(CURATED);
  });
});

describe('offerableSchemaFields', () => {
  test('never includes a grid-only column', () => {
    expect(offerableSchemaFields(CURATED, [field({ name: 'rating', type: AnalyticsFieldType.String })])).toEqual([]);
  });

  test('includes an offerable schema field', () => {
    expect(offerableSchemaFields(CURATED, [field()])).toEqual(['success_count']);
  });

  test('excludes a sensitive field, a non-scalar one and a heavy one', () => {
    const fields = [
      field({ sensitive: true }),
      field({ name: 'payload', type: AnalyticsFieldType.Object }),
      field({ name: 'traces', heavy: true }),
    ];

    expect(offerableSchemaFields(CURATED, fields)).toEqual([]);
  });

  test('is empty without a schema', () => {
    expect(offerableSchemaFields(CURATED)).toEqual([]);
  });
});

describe('catalog scope', () => {
  const catalog = buildConversationColumnCatalog(CURATED, [field()]);

  test('a schema-driven column is sortable and filterable', () => {
    expect(catalogSortableFields(catalog)).toContain('success_count');
    expect(catalogFilterableFields(catalog)).toContain('success_count');
  });

  test('rating offers neither', () => {
    expect(catalogSortableFields(catalog)).not.toContain('rating');
    expect(catalogFilterableFields(catalog)).not.toContain('rating');
  });

  test('activity sorts but does not filter', () => {
    expect(catalogSortableFields(catalog)).toContain(ConversationsField.LastRequestTime);
    expect(catalogFilterableFields(catalog)).not.toContain(ConversationsField.LastRequestTime);
  });
});

describe('catalogValueTypes', () => {
  test('contributes no type for a field type it does not enumerate', () => {
    const types = catalogValueTypes([field({ name: 'weird', type: 'geo_point' as AnalyticsFieldType })]);

    expect(types.weird).toBeUndefined();
  });

  test('keeps the curated types', () => {
    expect(catalogValueTypes()[ConversationsField.TotalPrice]).toBe(QueryValueType.Decimal);
  });

  test.each([
    [AnalyticsFieldType.String, QueryValueType.String],
    [AnalyticsFieldType.Uuid, QueryValueType.String],
    [AnalyticsFieldType.Integer, QueryValueType.Integer],
    [AnalyticsFieldType.Long, QueryValueType.Long],
    [AnalyticsFieldType.Decimal, QueryValueType.Decimal],
    [AnalyticsFieldType.Timestamp, QueryValueType.Timestamp],
  ])('maps the %s field type to %s', (type, expected) => {
    expect(catalogValueTypes([field({ name: 'measure', type })]).measure).toBe(expected);
  });
});

describe('projectableSchemaFields', () => {
  test('classifies a plain column of the source as source-backed', () => {
    expect(projectableSchemaFields(CURATED, [field()])).toEqual({
      sourceBacked: ['success_count'],
      enrichmentBacked: [],
    });
  });

  // An enrichment-supplied field is namespaced by its enrichment, leaving the backing name unqualified.
  test('classifies a namespaced field as enrichment-backed', () => {
    expect(projectableSchemaFields(CURATED, [enrichmentField('conversation_insights.topic')])).toEqual({
      sourceBacked: [],
      enrichmentBacked: ['conversation_insights.topic'],
    });
  });

  test('splits a schema carrying both', () => {
    const fields = [field(), enrichmentField('conversation_buckets.turn_bucket')];

    expect(projectableSchemaFields(CURATED, fields)).toEqual({
      sourceBacked: ['success_count'],
      enrichmentBacked: ['conversation_buckets.turn_bucket'],
    });
  });

  test('classifies nothing the catalog does not offer', () => {
    const fields = [field({ sensitive: true }), field({ name: 'traces', heavy: true })];

    expect(projectableSchemaFields(CURATED, fields)).toEqual({ sourceBacked: [], enrichmentBacked: [] });
  });

  test('is empty without a schema', () => {
    expect(projectableSchemaFields(CURATED)).toEqual({ sourceBacked: [], enrichmentBacked: [] });
  });
});
