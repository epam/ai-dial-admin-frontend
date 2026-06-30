'use client';

import { IconEye } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface CompareEyeCellRendererParams extends ICellRendererParams<CompareAnalyticsRow> {
  onOpenRowDetail?: (row: CompareAnalyticsRow) => void;
  selectedRowId?: string | null;
  viewRowDetailsLabel?: string;
}

const CompareEyeCellRenderer = (params: CompareEyeCellRendererParams) => {
  const row = params.data;
  const isActive = row?.id != null && row.id === params.selectedRowId;

  const onClick = () => {
    if (!row) return;
    params.onOpenRowDetail?.(row);
  };

  return (
    <button
      type="button"
      className={classNames(
        'flex items-center justify-center py-1 w-full h-full',
        isActive ? 'text-accent-primary' : 'text-secondary hover:text-primary',
      )}
      aria-label={params.viewRowDetailsLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <IconEye size={18} aria-hidden />
    </button>
  );
};

export default CompareEyeCellRenderer;
