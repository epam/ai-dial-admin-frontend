'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import { MODEL_RUN_PANEL_ID } from '@/src/components/Analytics/Pipelines/Preview/constants';
import { PreviewGridRow } from '@/src/components/Analytics/Pipelines/Preview/models';

interface Props extends ICellRendererParams<PreviewGridRow> {
  evaluatedIndex: number;
  isPanelExpanded: boolean;
  onTogglePanel: () => void;
}

const EvaluatedKeyCell: FC<Props> = ({ data, valueFormatted, evaluatedIndex, isPanelExpanded, onTogglePanel }) => {
  const text = valueFormatted ?? '';

  if (data?.index !== evaluatedIndex) return <>{text}</>;

  return (
    <button
      type="button"
      className="min-w-0 truncate text-accent-primary underline"
      aria-expanded={isPanelExpanded}
      aria-controls={MODEL_RUN_PANEL_ID}
      onClick={onTogglePanel}
    >
      {text}
    </button>
  );
};

export default EvaluatedKeyCell;
