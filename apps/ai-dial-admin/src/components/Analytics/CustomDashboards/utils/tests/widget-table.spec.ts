import { ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { getWidgetTableColumns } from '@/src/components/Analytics/CustomDashboards/utils/widget-table';
import { StructuredQueryResult } from '@/src/models/analytics/query';

const valueOf = (getter: unknown, data?: Record<string, unknown>) =>
  (getter as (params: ValueGetterParams<Record<string, unknown>>) => unknown)({
    data,
  } as ValueGetterParams<Record<string, unknown>>);

describe('getWidgetTableColumns', () => {
  const result = {
    columns: ['deployment', 'usage.cost'],
    rows: [{ deployment: 'gpt-4o', 'usage.cost': 12.5 }],
  } as unknown as StructuredQueryResult;

  test('reads each cell from the flat result row, a dotted column name included', () => {
    const [deployment, cost] = getWidgetTableColumns(result, { deployment: 'Deployment' });

    expect(deployment.headerName).toBe('Deployment');
    expect(valueOf(deployment.valueGetter, result.rows[0])).toBe('gpt-4o');
    expect(valueOf(cost.valueGetter, result.rows[0])).toBe(12.5);
  });

  test('reads nothing while the grid has no row', () => {
    const [deployment] = getWidgetTableColumns(result, {});

    expect(valueOf(deployment.valueGetter)).toBeUndefined();
  });
});
