import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import RadioNameCellRenderer from '../RadioNameCellRenderer';

const renderRenderer = (isSelected: boolean) => {
  const params = {
    value: 'Claude Opus',
    data: { id: 'metric-1' },
    node: { id: 'metric-1', isSelected: () => isSelected, setSelected: () => undefined },
    groupName: 'metric-selection',
  } as unknown as ICellRendererParams & { groupName: string };

  return render(<RadioNameCellRenderer {...params} />);
};

describe('RadioNameCellRenderer', () => {
  test('shows the name with a radio button', () => {
    renderRenderer(false);

    expect(screen.getByRole('radio')).toBeInTheDocument();
    expect(screen.getByText('Claude Opus')).toBeInTheDocument();
  });

  test('shows the avatar initials while the row is not selected', () => {
    renderRenderer(false);

    expect(screen.getByText('CO')).toBeInTheDocument();
  });

  test('hides the avatar once the row is selected', () => {
    renderRenderer(true);

    expect(screen.queryByText('CO')).not.toBeInTheDocument();
  });
});
