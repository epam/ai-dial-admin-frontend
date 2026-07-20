import { ColDef } from 'ag-grid-community';

import {
  getGroupedIdColumn,
  getGroupedNameColumn,
  getGroupedSchemaColumn,
  getTurnActionsColumn,
  getTurnExpanderColumn,
  TurnActionHandlers,
} from '@/src/components/TestSuites/utils/grouped-columns';
import { getValidityStatusColumn } from '@/src/components/TestSuites/utils/columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';

export type onCellChange = (data: Record<string, unknown>, field: string, value: string | number | boolean) => void;

const noop = () => {};

/**
 * Columns for the dataset test-case grid with UI-side turn grouping: a leading expander, an editable
 * name, per-schema cells (stacked read-only on collapsed group rows, editable on turn/single rows),
 * a validity status, and a turn-actions column. Conversation-grouping keys are managed by the UI and
 * are not shown as editable columns.
 */
export const getGroupedDatasetTestCaseColumns = (
  dataset: Dataset,
  onCellChange: onCellChange,
  t?: (key: string) => string,
  onToggleExpand: (groupKey: string) => void = noop,
  turnHandlers?: TurnActionHandlers,
): ColDef[] => {
  const schema: TestCaseSchema[] = dataset.testCaseSchema || [];
  const columns: ColDef[] = [
    getTurnExpanderColumn(onToggleExpand),
    getGroupedIdColumn(),
    getGroupedNameColumn(onCellChange),
    ...schema.map((param) =>
      getGroupedSchemaColumn(param, onCellChange, { entityId: dataset.id, view: ApplicationRoute.Datasets }),
    ),
    getValidityStatusColumn(t?.(TestSuitesI18nKey.TestCaseError)),
  ];
  if (turnHandlers) {
    columns.push(getTurnActionsColumn(turnHandlers));
  }
  return columns;
};
