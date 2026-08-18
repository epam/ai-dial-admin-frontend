import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import { ConversationsField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import {
  availableSelectFields,
  buildConversationColumnCatalog,
  offerableSchemaFields,
  catalogFilterableFields,
  catalogSortableFields,
  catalogValueTypes,
  projectableCatalogFields,
} from '@/src/utils/analytics/conversation-column-catalog';

const CURATED: ColDef[] = [
  { field: ConversationsField.ChatId, headerName: 'Conversation' },
  { field: ConversationsField.LastRequestTime, headerName: 'Activity', filter: false },
  { field: 'rating', headerName: 'Rating', sortable: false, filter: false },
];

const field = (overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField => ({
  name: 'success_count',
  type: AnalyticsFieldType.Integer,
  source: 'conversations',
  ...overrides,
});

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

  test('excludes a sensitive field and a non-scalar one', () => {
    const fields = [field({ sensitive: true }), field({ name: 'payload', type: AnalyticsFieldType.Object })];

    expect(offerableSchemaFields(CURATED, fields)).toEqual([]);
  });

  test('is empty without a schema', () => {
    expect(offerableSchemaFields(CURATED)).toEqual([]);
  });
});

describe('availableSelectFields', () => {
  const ORDERED = ['chat_id', 'conversation_insights.title', 'project_id'];
  const OPTIONAL = ['conversation_insights.title'];

  test('names an optional field the schema reports', () => {
    expect(availableSelectFields(ORDERED, OPTIONAL, ORDERED)).toEqual(ORDERED);
  });

  test('drops an optional field the schema does not report', () => {
    expect(availableSelectFields(ORDERED, OPTIONAL, ['chat_id', 'project_id'])).toEqual(['chat_id', 'project_id']);
  });

  test('keeps a required field the schema does not report, so a broken schema fails loudly', () => {
    expect(availableSelectFields(ORDERED, OPTIONAL, ['conversation_insights.title'])).toEqual([
      'chat_id',
      'conversation_insights.title',
      'project_id',
    ]);
  });

  test('names the required fields alone without a schema', () => {
    expect(availableSelectFields(ORDERED, OPTIONAL)).toEqual(['chat_id', 'project_id']);
    expect(availableSelectFields(ORDERED, OPTIONAL, [])).toEqual(['chat_id', 'project_id']);
  });

  test('preserves the given order', () => {
    expect(availableSelectFields(['c', 'b', 'a'], [], ['a', 'b', 'c'])).toEqual(['c', 'b', 'a']);
  });

  test('returns everything when nothing is optional', () => {
    expect(availableSelectFields(ORDERED, [])).toEqual(ORDERED);
  });
});

describe('projectableCatalogFields', () => {
  const schema = [
    field(),
    field({ name: ConversationsField.ChatId, type: AnalyticsFieldType.String }),
    field({ name: ConversationsField.LastRequestTime, type: AnalyticsFieldType.Timestamp }),
  ];

  // A curated column is not offered in the catalog, but it still reads a stored field — so showing it has
  // to bring that field into the projection, exactly as a schema-driven column does.
  test('includes a curated column backed by an entity field', () => {
    const projectable = projectableCatalogFields(CURATED, schema);

    expect(projectable).toContain(ConversationsField.ChatId);
    expect(projectable).toContain(ConversationsField.LastRequestTime);
  });

  test('includes the offerable schema fields as well', () => {
    expect(projectableCatalogFields(CURATED, schema)).toContain('success_count');
  });

  // Rating is composed from the feedback lookups, so the entity has no such column to project.
  test('excludes a composed column with no field on the entity', () => {
    expect(projectableCatalogFields(CURATED, schema)).not.toContain('rating');
  });

  test('excludes a curated field the schema does not report', () => {
    const curated = [...CURATED, { field: ConversationsField.Traces, headerName: 'Traces' }];

    expect(projectableCatalogFields(curated, schema)).not.toContain(ConversationsField.Traces);
  });

  test('lists every field once', () => {
    const projectable = projectableCatalogFields(CURATED, schema);

    expect(projectable).toHaveLength(new Set(projectable).size);
  });

  test('is empty without a schema', () => {
    expect(projectableCatalogFields(CURATED)).toEqual([]);
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
