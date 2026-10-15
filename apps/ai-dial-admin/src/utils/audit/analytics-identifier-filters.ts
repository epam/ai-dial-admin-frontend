import { GridFilter } from '@/src/models/grid-filter';
import { GridFilterType } from '@/src/types/grid-filter';

const IDENTIFIER_COLUMNS = ['activityId', 'parentActivityId'];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AnalyticsIdentifierFilters {
  filterModel: Record<string, GridFilter>;
  isEmpty: boolean;
}

// No activity carries an identifier that is not a UUID, so the backend's error on one is avoided: an equals on such
// text matches no row, and a not-equals matches every row.

export const applyAnalyticsIdentifierFilters = (
  filterModel: Record<string, GridFilter>,
): AnalyticsIdentifierFilters => {
  const applied = { ...filterModel };
  let isEmpty = false;

  IDENTIFIER_COLUMNS.forEach((column) => {
    const filter = applied[column];
    if (!filter?.filter) {
      return;
    }
    if (UUID_PATTERN.test(filter.filter.trim())) {
      applied[column] = { ...filter, filter: filter.filter.trim() };
      return;
    }
    if (filter.type === GridFilterType.EQUALS) {
      isEmpty = true;
    } else if (filter.type === GridFilterType.NOT_EQUAL) {
      delete applied[column];
    }
  });

  return { filterModel: applied, isEmpty };
};
