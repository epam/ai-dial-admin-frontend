import {
  CompareRowDetailField,
  CompareRowDetailSection,
  RowDetailDeltaFilter,
  RowDetailFieldFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import {
  getMetricDeltaSortValue,
  MetricDeltaKind,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { GridFilterType } from '@/src/types/grid-filter';

export interface RowDetailSectionFilterOptions {
  searchQuery: string;
  showDiffsOnly: boolean;
  fieldFilter?: RowDetailFieldFilter | null;
  deltaFilter?: RowDetailDeltaFilter | null;
}

const parseNumericRaw = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

const matchesFieldFilter = (label: string, filter: RowDetailFieldFilter): boolean => {
  const target = label.toLowerCase();
  const query = filter.value.trim().toLowerCase();
  if (!query) return true;

  switch (filter.operator) {
    case GridFilterType.CONTAINS:
      return target.includes(query);
    case GridFilterType.NOT_CONTAINS:
      return !target.includes(query);
    case GridFilterType.EQUALS:
      return target === query;
    case GridFilterType.NOT_EQUAL:
      return target !== query;
    default:
      return true;
  }
};

const matchesDeltaFilter = (delta: number | null, filter: RowDetailDeltaFilter): boolean => {
  if (delta == null) return false;

  switch (filter.operator) {
    case GridFilterType.GREATER_THAN:
      return delta > filter.value;
    case GridFilterType.GREATER_THAN_OR_EQUAL:
      return delta >= filter.value;
    case GridFilterType.LESS_THAN:
      return delta < filter.value;
    case GridFilterType.LESS_THAN_OR_EQUAL:
      return delta <= filter.value;
    case GridFilterType.EQUALS:
      return delta === filter.value;
    case GridFilterType.NOT_EQUAL:
      return delta !== filter.value;
    default:
      return true;
  }
};

const getRowDeltaValue = (row: CompareRowDetailField): number | null => {
  if (!row.isNumeric || !row.isMetric) return null;
  return getMetricDeltaSortValue(parseNumericRaw(row.primaryRaw), parseNumericRaw(row.secondaryRaw));
};

export const filterRowDetailSections = (
  sections: CompareRowDetailSection[],
  { searchQuery, showDiffsOnly, fieldFilter, deltaFilter }: RowDetailSectionFilterOptions,
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
        if (fieldFilter && !matchesFieldFilter(row.label, fieldFilter)) {
          return false;
        }
        if (deltaFilter && !matchesDeltaFilter(getRowDeltaValue(row), deltaFilter)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((section) => section.rows.length > 0);
};
