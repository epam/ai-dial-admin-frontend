import { ColDef, ITooltipParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

import { strictNumber } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { dateTimeColumn, numericColumn } from '@/src/constants/grid-columns/configs';
import { baseNumberFilter, dateFilter } from '@/src/constants/grid-columns/filters';
import { toNumberOrNull } from '@/src/constants/grid-columns/formatters';
import { ResultValueClass } from '@/src/models/analytics/query-builder';
import { formatDateTimeToLocalString, toDateOrNull } from '@/src/utils/formatting/date';
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

// The shared column configs filter on `data[field]`, but a result row is wrapped (see `ResultGridRow`): read the
// column's own value instead, which its `valueGetter` resolves.
const cellValueOf = ({ column, getValue }: ValueGetterParams) => getValue(column.getColId());

const getNumericColumn = (format: (value: number) => string): Partial<ColDef> => ({
  ...numericColumn,
  ...baseNumberFilter,
  filterValueGetter: (params: ValueGetterParams) => toNumberOrNull(cellValueOf(params)),
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
    // `ResultValueCell` renders plain text with no kit tooltip, so this grid keeps the AG tooltip.
    case ResultValueClass.DateTime:
      return {
        ...dateTimeColumn,
        tooltipValueGetter: ({ value }: ITooltipParams) => formatDateTimeToLocalString(value),
        filterValueGetter: (params: ValueGetterParams) => toDateOrNull(cellValueOf(params)),
        ...dateFilter,
      };
    default:
      return {};
  }
};
