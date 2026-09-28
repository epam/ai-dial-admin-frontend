import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import MeasuresEditor from '@/src/components/Analytics/Pipelines/Aggregate/MeasuresEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
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

const field = (name: string, source = name): AnalyticsEntityField => ({ name, source, type: AnalyticsFieldType.Long });

// What the service accepts from this source: its own columns plus the ones an enrichment supplies.
const sourceFields = [
  field('deployment_price'),
  field('total_tokens'),
  field('usage_client_identity.client_session_id', 'client_session_id'),
];
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
      fields={sourceFields}
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

  // The service validates a measure against the source's entity, so a column an enrichment supplies is
  // one it accepts — and the editor used to offer only the table's own columns, hiding them.
  test('offers a column an enrichment supplies', async () => {
    const user = userEvent.setup();
    renderEditor();

    const column = screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureColumn} 1` });
    await user.click(within(column).getByRole('button'));

    expect(await screen.findByRole('option', { name: /usage_client_identity\.client_session_id/ })).toBeTruthy();
  });

  // A column written in the JSON editor is not one the form may quietly drop.
  test('keeps a column the entity does not offer', async () => {
    const user = userEvent.setup();
    renderEditor([{ name: 'total_price', fn: 'sum', column: 'written_by_hand.value' }]);

    const column = screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.MeasureColumn} 1` });
    await user.click(within(column).getByRole('button'));

    expect(await screen.findByRole('option', { name: 'written_by_hand.value' })).toBeTruthy();
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
