'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { isRightAlignedCell } from './utils';

/**
 * Plain text cell that honours the column's `valueFormatter`. The kit grid's default cell prints the
 * raw `value`, so a formatted column (dates, numbers) would otherwise show the unformatted value.
 */
const FormattedValueCellRenderer = (params: ICellRendererParams) => {
  const { data, value, valueFormatted } = params;

  if (!data) {
    return null;
  }

  const text = valueFormatted ?? (value == null ? '' : String(value));

  // The kit's `text-start` is `!important`, so a stylesheet rule cannot beat it; the class merge can.
  return (
    <EllipsisTooltip
      className={classNames('max-w-full dial-small-text', isRightAlignedCell(params) && 'text-right')}
      text={text}
    />
  );
};

export default FormattedValueCellRenderer;
