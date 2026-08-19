import { ColDef } from 'ag-grid-community';

import { dateTimeColumn, numericColumn } from '@/src/constants/grid-columns/configs';
import { baseNumberFilter, baseStringFilter, dateFilter } from '@/src/constants/grid-columns/filters';
import {
  ANALYTICS_FIELD_QUERY_VALUE_TYPE,
  CONVERSATION_FIELD_VALUE_TYPE,
  CURATED_COMPOSED_FIELDS,
  DATE_FIELD_TYPES,
  NON_SCALAR_FIELD_TYPES,
  NUMERIC_FIELD_TYPES,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationProjectableFields } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';

const isOfferable = (field: AnalyticsEntityField, consumed: Set<string>): boolean =>
  !field.sensitive && !field.heavy && !NON_SCALAR_FIELD_TYPES.includes(field.type) && !consumed.has(field.name);

const consumedFields = (curated: ColDef[]): Set<string> =>
  new Set<string>([...curated.map((column) => column.field as string), ...CURATED_COMPOSED_FIELDS]);

export const offerableSchemaFields = (curated: ColDef[], fields: AnalyticsEntityField[] = []): string[] => {
  const consumed = consumedFields(curated);

  return fields.filter((field) => isOfferable(field, consumed)).map((field) => field.name);
};

// A plain column of the entity's own source reports its flat name as the field backing it, so the two are
// equal. Anything the service supplies through an enrichment is namespaced by that enrichment, leaving the
// backing name unqualified — `conversation_insights.title` sources `title`. The inequality therefore reads
// as "not a plain column of the table the query already reads", which also covers a JSON-derived field:
// likewise not free to project, and likewise better fetched on demand.
const isSourceBacked = (field: AnalyticsEntityField): boolean => field.name === field.source;

export const projectableSchemaFields = (
  curated: ColDef[],
  fields: AnalyticsEntityField[] = [],
): ConversationProjectableFields => {
  const consumed = consumedFields(curated);
  // A curated column is not offered in the catalog — it is designed rather than derived — but it still reads
  // a stored field, so showing it has to bring that field into the projection on the same terms as a
  // schema-derived one. Membership in the schema is the test, so the composed Rating column, which has no
  // field on this entity, falls out without an exclusion list to maintain.
  const projectable = [
    ...fields.filter((field) => isOfferable(field, consumed)),
    ...fields.filter((field) => consumed.has(field.name)),
  ];

  return {
    sourceBacked: projectable.filter(isSourceBacked).map((field) => field.name),
    enrichmentBacked: projectable.filter((field) => !isSourceBacked(field)).map((field) => field.name),
  };
};

// The service rejects a whole query that names one field its entity does not carry, and the rollups are
// catalog objects provisioned per instance rather than shipped with the service — so an instance can carry
// an older field set than this frontend knows. A field beyond the view's required core is therefore named
// only when the fetched schema reports it. With no schema in hand the required core is all that is named:
// a failed schema fetch is not evidence that an optional field exists, and guessing costs every row.
export const availableSelectFields = (ordered: string[], optional: string[], schemaFieldNames?: string[]): string[] => {
  const isOptional = new Set(optional);
  const available = new Set(schemaFieldNames ?? []);

  return ordered.filter((name) => !isOptional.has(name) || available.has(name));
};

const typeColumn = (type: AnalyticsFieldType): Partial<ColDef> => {
  if (NUMERIC_FIELD_TYPES.includes(type)) {
    return { ...numericColumn, ...baseNumberFilter };
  }
  if (DATE_FIELD_TYPES.includes(type)) {
    return { ...dateTimeColumn, ...dateFilter };
  }
  return { ...baseStringFilter };
};

const toCatalogColumn = (field: AnalyticsEntityField): ColDef => ({
  field: field.name,
  headerName: field.display_name || field.name,
  ...(field.description ? { headerTooltip: field.description } : {}),
  ...typeColumn(field.type),
  minWidth: 140,
  flex: 1,
  hide: true,
});

export const buildConversationColumnCatalog = (curated: ColDef[], fields: AnalyticsEntityField[] = []): ColDef[] => {
  const offerable = new Set(offerableSchemaFields(curated, fields));

  return [...curated, ...fields.filter((field) => offerable.has(field.name)).map(toCatalogColumn)];
};

export const catalogValueTypes = (fields: AnalyticsEntityField[] = []): Record<string, QueryValueType> => {
  const types = { ...CONVERSATION_FIELD_VALUE_TYPE } as Record<string, QueryValueType>;

  fields.forEach((field) => {
    const valueType = ANALYTICS_FIELD_QUERY_VALUE_TYPE[field.type];
    if (valueType) {
      types[field.name] = valueType;
    }
  });

  return types;
};

export const catalogSortableFields = (catalog: ColDef[]): string[] =>
  catalog.filter((column) => column.sortable !== false && column.field).map((column) => column.field as string);

export const catalogFilterableFields = (catalog: ColDef[]): string[] =>
  catalog.filter((column) => column.filter !== false && column.field).map((column) => column.field as string);
