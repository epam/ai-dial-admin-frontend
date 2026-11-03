import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { getResultColumns } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { StructuredQueryResult } from '@/src/models/analytics/query';

type WidgetTableRow = Record<string, unknown>;

export const getWidgetTableColumns = (
  result: StructuredQueryResult,
  columnLabels: Record<string, string>,
): ColDef<WidgetTableRow>[] =>
  getResultColumns(result, columnLabels).map((col) => {
    const field = col.field ?? '';
    return { ...col, valueGetter: ({ data }: ValueGetterParams<WidgetTableRow>) => data?.[field] };
  });
