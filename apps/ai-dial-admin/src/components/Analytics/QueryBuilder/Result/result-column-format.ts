import { ColDef, ITooltipParams, ValueFormatterParams } from 'ag-grid-community';

import { strictNumber } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { dateTimeColumn, numericColumn } from '@/src/constants/grid-columns/configs';
import { baseNumberFilter, dateFilter } from '@/src/constants/grid-columns/filters';
import { ResultValueClass } from '@/src/models/analytics/query-builder';
import {
  formatNumberByDelimiter,
  formatNumberWithExponent,
  formatSignificantNumber,
} from '@/src/utils/formatting/number-formatting';

const exactNumberText = (value: unknown): string => {
  const parsed = strictNumber(value);
  if (parsed !== null && Number.isInteger(parsed)) {
    return formatNumberByDelimiter(value as string | number);
  }
  return renderCell(value);
};

const getNumericColumn = (format: (value: number) => string): Partial<ColDef> => ({
  ...numericColumn,
  ...baseNumberFilter,
  valueFormatter: ({ value }: ValueFormatterParams) => {
    const parsed = strictNumber(value);
    // Fall back to today's rendering rather than blanking a value the run returned.
    return parsed === null ? renderCell(value) : format(parsed);
  },
  tooltipValueGetter: ({ value }: ITooltipParams) => exactNumberText(value),
});

export const getValueClassColumn = (valueClass?: ResultValueClass): Partial<ColDef> => {
  switch (valueClass) {
    case ResultValueClass.Compact:
      return getNumericColumn(formatNumberWithExponent);
    case ResultValueClass.Significant:
      return getNumericColumn(formatSignificantNumber);
    // A duration column is left unformatted on purpose. Its header is the catalog's `display_name`, which
    // states the unit ("Duration (ms)"), so a formatted cell would contradict its own header — and the client
    // does not rewrite catalog display text. The recognition's whole job is to keep this column out of
    // `Compact`, which rendered a millisecond count as `698.7 K`. Do not "fix" this back to a duration
    // formatter without first moving the unit out of the header; see design.md §12.
    case ResultValueClass.Duration:
      return {};
    // `dateFilter` travels with `dateTimeColumn` as one unit: its `filterValueGetter` returns a Date,
    // and `agDateColumnFilter` without `dateFilter`'s `floatingFilter: false` throws on the `contains`
    // model a text floating filter sends (see `constants/grid-columns/filters.ts`).
    case ResultValueClass.DateTime:
      return { ...dateTimeColumn, ...dateFilter };
    default:
      return {};
  }
};
