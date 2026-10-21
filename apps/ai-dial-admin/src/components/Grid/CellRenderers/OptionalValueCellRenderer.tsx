'use client';

import classNames from 'classnames';
import { ICellRendererParams } from 'ag-grid-community';

export const MISSING_VALUE_DISPLAY = '—';

/**
 * Renders a column's formatted value, or the missing-value indication in secondary text when the row
 * has no value. Columns whose absent value must not read as `0` (duration, cost, score) supply a
 * `valueFormatter` that maps "no value" to `MISSING_VALUE_DISPLAY`.
 */
const OptionalValueCellRenderer = ({ value, valueFormatted }: ICellRendererParams) => {
  const formatted = valueFormatted ?? (value == null ? '' : String(value));
  const isMissing = !formatted || formatted === MISSING_VALUE_DISPLAY;

  return (
    <span className={classNames('dial-small-text', isMissing ? 'text-secondary' : 'text-primary')}>
      {isMissing ? MISSING_VALUE_DISPLAY : formatted}
    </span>
  );
};

export default OptionalValueCellRenderer;
