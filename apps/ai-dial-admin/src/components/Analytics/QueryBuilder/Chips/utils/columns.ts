import { AnalyticsEntityField } from '@/src/models/analytics/entity';

export const toggledColumns = (selected: string[], names: string[], isSelected: boolean): string[] => {
  const targets = new Set(names);
  const kept = selected.filter((name) => !targets.has(name));
  return isSelected ? [...kept, ...names] : kept;
};

export const selectedCount = (selected: string[], fields: AnalyticsEntityField[]): number =>
  fields.filter((field) => selected.includes(field.name)).length;

export const inSchemaOrder = (selected: string[], fields: AnalyticsEntityField[]): string[] =>
  fields.filter((field) => selected.includes(field.name)).map((field) => field.name);
