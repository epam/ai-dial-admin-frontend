'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * Plain text cell that honours the column's `valueFormatter`. The kit grid's default cell prints the
 * raw `value`, so a formatted column (dates, numbers) would otherwise show the unformatted value.
 */
const FormattedValueCellRenderer = ({ data, value, valueFormatted }: ICellRendererParams) => {
  if (!data) {
    return null;
  }

  const text = valueFormatted ?? (value == null ? '' : String(value));

  return <EllipsisTooltip className="max-w-full dial-small-text" text={text} />;
};

export default FormattedValueCellRenderer;
