import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import MeasureCell from '@/src/components/Analytics/Usage/Breakdown/cells/MeasureCell';
import { BreakdownDeltas, BreakdownRowModel, KpiMetric } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const NO_DELTAS: BreakdownDeltas = { calls: null, errorRate: null, avgLatencyMs: null, spend: null };

const rowModel = (overrides: Partial<BreakdownRowModel> = {}): BreakdownRowModel => ({
  id: 'gpt-4o',
  displayLabel: 'gpt-4o',
  isFallbackLabel: false,
  calls: 120,
  failed: 2,
  share: 0.5,
  deltas: NO_DELTAS,
  isNewRow: false,
  errorRate: 0.02,
  avgLatencyMs: 180,
  spend: 12,
  ...overrides,
});

type Params = Parameters<typeof MeasureCell>[0];

const renderCell = (props: Partial<Params> = {}) =>
  render(
    <MeasureCell
      {...({} as Params)}
      data={rowModel()}
      metric={KpiMetric.Requests}
      deltaKey="calls"
      format={(row) => String(row.calls)}
      {...props}
    />,
  );

describe('MeasureCell', () => {
  test('states the figure the column formats', () => {
    renderCell();

    expect(screen.getByText('120')).toBeTruthy();
  });

  test('renders the no-value dash where the row carries no figure', () => {
    renderCell({ format: () => null });

    expect(screen.getByText('—')).toBeTruthy();
  });

  test('states the measure own change beside it', () => {
    renderCell({ data: rowModel({ deltas: { ...NO_DELTAS, calls: 0.25 } }) });

    expect(screen.getByText('25.0%')).toBeTruthy();
  });

  test('reads a cost rise as unwelcome and a call rise as welcome', () => {
    const { container: calls } = renderCell({ data: rowModel({ deltas: { ...NO_DELTAS, calls: 0.25 } }) });
    const { container: cost } = renderCell({
      data: rowModel({ deltas: { ...NO_DELTAS, spend: 0.25 } }),
      metric: KpiMetric.TotalSpend,
      deltaKey: 'spend',
      format: (row) => String(row.spend),
    });

    expect(calls.querySelector('.text-success')).toBeTruthy();
    expect(cost.querySelector('.text-error')).toBeTruthy();
  });

  test('says a row is new on the ranked column, where there is nothing to divide by', () => {
    renderCell({ data: rowModel({ isNewRow: true }) });

    expect(screen.getByText(AnalyticsUsageI18nKey.RowIsNew)).toBeTruthy();
  });

  test('does not repeat that on every other column', () => {
    renderCell({
      data: rowModel({ isNewRow: true }),
      deltaKey: 'spend',
      metric: KpiMetric.TotalSpend,
      format: (row) => String(row.spend),
    });

    expect(screen.queryByText(AnalyticsUsageI18nKey.RowIsNew)).toBeNull();
  });

  test('states the exact figure alongside the rounded one, where the column rounded it', () => {
    renderCell({ format: () => '0.0%', formatExact: () => '12 failed of 30,000 calls · 0.0400%' });

    expect(screen.getByText('0.0%')).toBeTruthy();
    expect(screen.getByText('12 failed of 30,000 calls · 0.0400%')).toBeTruthy();
  });

  test('states none where the caller offers none', () => {
    renderCell({ format: () => '0.0%' });

    expect(screen.getByText('0.0%')).toBeTruthy();
    expect(screen.queryByText(/failed of/)).toBeNull();
  });

  test('states none for a row with no figure at all, which has nothing to be exact about', () => {
    renderCell({ format: () => null, formatExact: () => 'never shown' });

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('never shown')).toBeNull();
  });
});
