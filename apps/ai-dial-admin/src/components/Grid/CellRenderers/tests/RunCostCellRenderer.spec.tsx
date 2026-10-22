import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { RunsI18nKey } from '@/src/constants/i18n';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import RunCostCellRenderer from '../RunCostCellRenderer';

const NOW = 1_700_000_000_000;

const renderCell = (data: Run, valueFormatted: string | null = null) =>
  render(
    <RunCostCellRenderer
      {...({ data, value: data.totalCost ?? null, valueFormatted } as unknown as ICellRendererParams<Run>)}
    />,
  );

describe('RunCostCellRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows a labelled spinner instead of the dash while the cost is being calculated', () => {
    renderCell({ status: RunStatus.COMPLETED, completedAt: NOW - 1000 }, '—');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText(RunsI18nKey.Calculating)).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  test('shows the computed cost once it is available', () => {
    renderCell({ status: RunStatus.COMPLETED, completedAt: NOW - 1000, totalCost: 0.42 }, '$0.42');

    expect(screen.getByText('$0.42')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('keeps the dash for a run whose cost is not being calculated', () => {
    renderCell({ status: RunStatus.RUNNING }, '—');

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
