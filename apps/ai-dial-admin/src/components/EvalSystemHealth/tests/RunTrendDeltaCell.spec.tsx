import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';

import RunTrendDeltaCell from '@/src/components/EvalSystemHealth/RunTrendDeltaCell';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  Badge: ({ label, color }: { label: string; color: string }) => <span data-color={color}>{label}</span>,
}));

const renderCell = (deltaLabel: string | null) =>
  render(<RunTrendDeltaCell {...({ data: { deltaLabel } as RunTrendRow } as ICellRendererParams<RunTrendRow>)} />);

describe('RunTrendDeltaCell', () => {
  test('shows a rise as a green badge', () => {
    renderCell('+10%');

    expect(screen.getByText('+10%').getAttribute('data-color')).toBe('green');
  });

  test('shows a fall as a red badge', () => {
    renderCell('-10%');

    expect(screen.getByText('-10%').getAttribute('data-color')).toBe('red');
  });

  test('shows a dash when there is no change to report', () => {
    renderCell(null);

    expect(screen.getByText('—')).toBeTruthy();
  });
});
