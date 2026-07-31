import { ColDef } from 'ag-grid-community';

import {
  getGroupedIdColumn,
  getGroupedNameColumn,
  getGroupedSchemaColumn,
  getTurnExpanderColumn,
} from '@/src/components/Grid/columns/turn-columns';
import { getValidityStatusColumn } from '@/src/components/TestSuites/utils/columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';

export type onCellChange = (data: Record<string, unknown>, field: string, value: string | number | boolean) => void;

export interface DatasetTestCaseColumnsOptions {
  dataset: Dataset;
  onCellChange: onCellChange;
  onToggleExpand: (groupKey: string) => void;
  t?: (key: string) => string;
}

export const getDatasetTestCaseColumns = (options: DatasetTestCaseColumnsOptions): ColDef[] => {
  const { dataset, onCellChange, onToggleExpand, t } = options;
  const schema: TestCaseSchema[] = dataset.testCaseSchema || [];

  return [
    getTurnExpanderColumn(onToggleExpand),
    getGroupedIdColumn(),
    getGroupedNameColumn(onCellChange),
    ...schema.map((param) =>
      getGroupedSchemaColumn(param, onCellChange, { entityId: dataset.id, view: ApplicationRoute.Datasets }),
    ),
    getValidityStatusColumn(t?.(TestSuitesI18nKey.TestCaseError)),
  ];
};
