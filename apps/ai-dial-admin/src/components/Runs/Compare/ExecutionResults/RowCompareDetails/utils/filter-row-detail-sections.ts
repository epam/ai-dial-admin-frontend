import { CompareRowDetailSection } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export interface RowDetailSectionFilterOptions {
  searchQuery: string;
  showDiffsOnly: boolean;
}

export const filterRowDetailSections = (
  sections: CompareRowDetailSection[],
  { searchQuery, showDiffsOnly }: RowDetailSectionFilterOptions,
): CompareRowDetailSection[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => {
        if (showDiffsOnly && row.diffKind === MetricDeltaKind.Empty) {
          return false;
        }
        if (normalizedQuery && !row.label.toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((section) => section.rows.length > 0);
};
