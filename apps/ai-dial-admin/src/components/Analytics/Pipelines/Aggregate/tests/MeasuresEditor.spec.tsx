import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import MeasuresEditor from '@/src/components/Analytics/Pipelines/Aggregate/MeasuresEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Measure } from '@/src/models/analytics/pipeline';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
import {
  QueryFunction,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';

const column = (name: string): AnalyticsTableColumn => ({
  source_name: name,
  name,
  type: AnalyticsFieldType.Long,
});

const sourceColumns = [column('deployment_price'), column('total_tokens')];
const targetColumns = [column('total_price'), column('total_tokens')];

const functions: QueryFunction[] = [
  {
    name: 'sum',
    group: QueryFunctionGroup.Aggregate,
    signature: 'sum(value)',
    returns: QueryFunctionReturnType.Numeric,
    distinct_supported: true,
    description: 'Sum of a numeric expression over the group; distinct deduplicates values first.',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
];

const renderEditor = (measures: Measure[] = [{ name: 'total_price', fn: 'sum', column: 'deployment_price' }]) =>
  render(
    <MeasuresEditor
      measures={measures}
      columns={sourceColumns}
      targetColumns={targetColumns}
      functions={functions}
      onChange={vi.fn()}
    />,
  );

describe('MeasuresEditor', () => {
  test('states each field once for the list rather than on every row', () => {
    renderEditor();

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.MeasureName)).toHaveLength(1);
    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.MeasureColumn)).toHaveLength(1);
  });

  test('names every row control, which the hidden header cannot do', () => {
    renderEditor();

    // The header labels are `hidden lg:grid` and carry no htmlFor, so each control carries its own name.
    expect(screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureName} 1` })).toBeTruthy();
    expect(screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureFn} 1` })).toBeTruthy();
    expect(screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureColumn} 1` })).toBeTruthy();
    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.MeasureWhere} 1`)).toBeTruthy();
  });

  test('states that an unset column defaults to the measure name', () => {
    renderEditor([{ name: 'total_price', fn: 'sum' }]);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.MeasureColumnDefault)).toBeTruthy();
  });

  test("reveals a function's catalog description on hover rather than under the label", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureFn} 1` }));

    expect(screen.queryByText(functions[0].description)).toBeNull();
    await user.hover(screen.getByText('sum(value)'));
    expect(await screen.findByText(functions[0].description)).toBeTruthy();
  });

  test('offers the add control', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.AddMeasure })).toBeTruthy();
  });

  test('keeps every measure on one row as the list grows', () => {
    renderEditor([
      { name: 'total_price', fn: 'sum', column: 'deployment_price' },
      { name: 'total_tokens', fn: 'sum', column: 'total_tokens' },
    ]);

    expect(screen.getByRole('button', { name: 'Buttons.Delete 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buttons.Delete 2' })).toBeTruthy();
  });
});
