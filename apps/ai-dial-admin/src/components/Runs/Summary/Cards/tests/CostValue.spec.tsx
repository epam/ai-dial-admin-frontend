import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { RunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { RunsI18nKey } from '@/src/constants/i18n';
import CostValue from '../CostValue';

const SETTLED: RunCostState = {
  totalCost: 120,
  sourceCost: 100,
  metricsCost: 20,
  isPending: false,
  isMetricsPending: false,
  hasError: false,
};

const renderCost = (cost: Partial<RunCostState> = {}) =>
  render(<CostValue cost={{ ...SETTLED, ...cost }} sourceLabel="Model" />);

describe('CostValue', () => {
  test('shows the total and both labelled parts', () => {
    renderCost();

    expect(screen.getByText('$120')).toBeTruthy();
    expect(screen.getByText('Model:')).toBeTruthy();
    expect(screen.getByText('$100')).toBeTruthy();
    expect(screen.getByText('$20')).toBeTruthy();
  });

  test('dashes only the metrics value when just the metrics cost is absent', () => {
    renderCost({ totalCost: 0.42, sourceCost: 0.42, metricsCost: null });

    expect(screen.getAllByText('$0.42')).toHaveLength(2);
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  test('shows zero as a real cost', () => {
    renderCost({ totalCost: 0, sourceCost: 0, metricsCost: 0 });

    expect(screen.getAllByText('$0')).toHaveLength(3);
    expect(screen.queryByText('—')).toBeNull();
  });

  test('shows a single dash and no breakdown when settled without a figure', () => {
    renderCost({ totalCost: null, sourceCost: null, metricsCost: null });

    expect(screen.getAllByText('—')).toHaveLength(1);
    expect(screen.queryByText('Model:')).toBeNull();
  });

  test('shows the calculating label and expectation copy while pending', () => {
    renderCost({ isPending: true, isMetricsPending: true, totalCost: null, sourceCost: null, metricsCost: null });

    expect(screen.getByRole('status').textContent).toBe(RunsI18nKey.Calculating);
    expect(screen.getByText(RunsI18nKey.CostCalculatingElapsed)).toBeTruthy();
    expect(screen.queryByText('Model:')).toBeNull();
  });

  test('settles the Metrics value to a dash while the rest still calculates for a run with no metrics', () => {
    renderCost({ isPending: true, isMetricsPending: false, totalCost: null, sourceCost: null, metricsCost: null });

    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('Model:')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText(RunsI18nKey.CostCalculatingElapsed)).toBeNull();
  });
});
