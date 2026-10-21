'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import OptionalValueCellRenderer from '@/src/components/Grid/CellRenderers/OptionalValueCellRenderer';
import { isRunCostCalculating } from '@/src/components/Runs/utils/run-list-values';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

const SPINNER_SIZE = 14;

/**
 * Shows a spinner in place of the missing-value dash while the run's cost is still being aggregated.
 * Whoever owns the grid must re-patch the row when the cost lands, since the cell only re-evaluates
 * when its row data changes.
 */
const RunCostCellRenderer = (params: ICellRendererParams<Run>) => {
  const t = useI18n();

  if (!isRunCostCalculating(params.data, Date.now())) {
    return <OptionalValueCellRenderer {...params} />;
  }

  return (
    <span className="flex items-center justify-end">
      <DialLoader size={SPINNER_SIZE} fullWidth={false} ariaLabel={t(RunsI18nKey.Calculating)} />
    </span>
  );
};

export default RunCostCellRenderer;
