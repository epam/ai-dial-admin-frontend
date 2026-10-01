import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import DimensionCell from '@/src/components/Analytics/Usage/Breakdown/cells/DimensionCell';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';

const LABEL = 'Direct call';
const EXPLANATION = 'Called directly by key or user - no parent deployment';

const renderCell = () => {
  const data = {
    id: 'route:missing',
    displayLabel: LABEL,
    isFallbackLabel: true,
    fallbackTooltip: EXPLANATION,
  } as BreakdownRowModel;
  const params = { data } as ICellRendererParams<BreakdownRowModel>;

  return render(<DimensionCell {...params} onOpenRow={vi.fn()} />);
};

describe('DimensionCell', () => {
  test('shows only the explanation while the pointer is on the info icon', async () => {
    const user = userEvent.setup();
    const { container } = renderCell();

    await user.hover(container.querySelector('svg') as SVGElement);

    expect(await screen.findByText(EXPLANATION)).toBeInTheDocument();
    expect(screen.getAllByText(LABEL)).toHaveLength(1);
  });

  test('shows only the name while the pointer is on the label', async () => {
    const user = userEvent.setup();
    renderCell();

    await user.hover(screen.getByRole('button', { name: LABEL }));

    await waitFor(() => expect(screen.getAllByText(LABEL)).toHaveLength(2));
    expect(screen.queryByText(EXPLANATION)).toBeNull();
  });
});
