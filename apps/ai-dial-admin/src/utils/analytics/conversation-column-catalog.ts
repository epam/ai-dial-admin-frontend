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
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';

export const offerableSchemaFields = (curated: ColDef[], fields: AnalyticsEntityField[] = []): string[] => {
  const consumed = new Set<string>([...curated.map((column) => column.field as string), ...CURATED_COMPOSED_FIELDS]);

  return fields
    .filter((field) => !field.sensitive && !NON_SCALAR_FIELD_TYPES.includes(field.type) && !consumed.has(field.name))
    .map((field) => field.name);
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
