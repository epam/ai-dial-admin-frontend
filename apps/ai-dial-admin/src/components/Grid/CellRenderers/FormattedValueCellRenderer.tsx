'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { GridColumnType } from '@/src/types/grid-column';

/**
 * Plain text cell that honours the column's `valueFormatter`. The kit grid's default cell prints the
 * raw `value`, so a formatted column (dates, numbers) would otherwise show the unformatted value.
 * Replacing the default cell also drops the kit's right alignment, so it is restored here.
 */
const FormattedValueCellRenderer = ({ data, value, valueFormatted, colDef }: ICellRendererParams) => {
  if (!data) {
    return null;
  }

  const text = valueFormatted ?? (value == null ? '' : String(value));
  const isRightAligned = [colDef?.type ?? []].flat().includes(GridColumnType.RightAligned);

  return (
    <EllipsisTooltip className={classNames('max-w-full dial-small-text', { 'text-end': isRightAligned })} text={text} />
  );
};

export default FormattedValueCellRenderer;
