import { SelectOption } from '@epam/ai-dial-ui-kit';

import { StructuredQuery } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

/**
 * One result row as the grid holds it. The grid identifies a row by its content unless told otherwise, so rows that
 * read identically (a projection of a few columns, or a shared `id` value) would collapse to one; each row carries the
 * place it came in.
 */
export interface ResultGridRow {
  index: number;
  values: Record<string, unknown>;
}

export interface ChartSlotView {
  id: string;
  label: string;
  options: SelectOption[];
  value: string | string[] | undefined;
  isMultiple: boolean;
  onChange: (value: string | string[]) => void;
}

export interface ScorecardTrendSource {
  query: StructuredQuery | null;
  timeField: string | null;
  range: TimeRange;
}
