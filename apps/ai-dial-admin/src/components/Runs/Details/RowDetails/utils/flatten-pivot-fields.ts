import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';

export interface PivotColumn {
  sectionKey: string;
  sectionLabel: string;
  isSectionStart: boolean;
  field: RowDetailField;
  hasDelta: boolean;
}

export const flattenPivotFields = (sections: RowDetailSection[]): PivotColumn[] => {
  const columns: PivotColumn[] = [];

  for (const section of sections) {
    section.rows.forEach((field, index) => {
      columns.push({
        sectionKey: section.key,
        sectionLabel: section.label,
        isSectionStart: index === 0,
        field,
        hasDelta: field.isNumeric && field.isMetric,
      });
    });
  }

  return columns;
};
